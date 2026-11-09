import sys
import os
import urllib.parse
import traceback
from pathlib import Path

# Set serverless environment flags
os.environ["NETLIFY"] = "true"

# Add project root directory to sys.path (ensuring no collision with function file)
function_dir = Path(__file__).resolve().parent
repo_root = function_dir.parent.parent

# Search for the root containing app.py
for candidate in [repo_root, function_dir.parent, Path("/var/task"), Path.cwd()]:
    if (candidate / "app.py").exists() and str(candidate) != str(function_dir):
        if str(candidate) not in sys.path:
            sys.path.insert(0, str(candidate))
        break

from app import app

def normalize_event_path(event):
    """Extract and normalize the true requested client URL from Netlify rewrite metadata."""
    headers = event.get('headers') or {}
    
    # Check Netlify original URL headers injected by CDN rewrites
    for h in ['x-nf-original-url', 'x-nf-original-path', 'x-original-url', 'x-forwarded-uri']:
        val = headers.get(h) or headers.get(h.lower())
        if val:
            parsed = urllib.parse.urlparse(val)
            if parsed.path:
                return parsed.path

    # Check rawUrl
    raw_url = event.get('rawUrl')
    if raw_url:
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.path:
            return parsed.path

    # Fallback to event['path'], stripping Netlify function slug if present
    path = event.get('path', '/')
    for prefix in ['/.netlify/functions/server', '/.netlify/functions/app', '/.netlify/functions/api']:
        if path.startswith(prefix):
            path = path[len(prefix):] or '/'
            break
    return path

try:
    from serverless_wsgi import handle as handle_wsgi
    def _execute(event, context):
        clean_path = normalize_event_path(event)
        event['path'] = clean_path
        if 'rawPath' in event:
            event['rawPath'] = clean_path
        if 'requestContext' in event and isinstance(event['requestContext'], dict):
            if 'http' in event['requestContext'] and isinstance(event['requestContext']['http'], dict):
                event['requestContext']['http']['path'] = clean_path
        return handle_wsgi(app, event, context)
except ImportError:
    import base64

    def _execute(event, context):
        http_method = event.get('httpMethod', 'GET')
        path = normalize_event_path(event)
        
        # Query parameters handling
        query_params = event.get('queryStringParameters') or {}
        if query_params:
            path += '?' + urllib.parse.urlencode(query_params)
            
        headers = event.get('headers', {})
        body = event.get('body', '')
        if event.get('isBase64Encoded', False) and body:
            body = base64.b64decode(body)
        elif isinstance(body, str):
            body = body.encode('utf-8')

        with app.test_client() as client:
            resp = client.open(
                path=path,
                method=http_method,
                headers=headers,
                data=body
            )
            
            is_base64 = False
            resp_body = resp.get_data()
            content_type = resp.headers.get('Content-Type', '')
            
            # Binary content detection
            if any(bt in content_type for bt in ['image/', 'font/', 'application/octet-stream', 'audio/', 'video/']):
                is_base64 = True
                resp_str = base64.b64encode(resp_body).decode('utf-8')
            else:
                try:
                    resp_str = resp_body.decode('utf-8')
                except UnicodeDecodeError:
                    is_base64 = True
                    resp_str = base64.b64encode(resp_body).decode('utf-8')

            resp_headers = dict(resp.headers)
            return {
                "statusCode": resp.status_code,
                "headers": resp_headers,
                "body": resp_str,
                "isBase64Encoded": is_base64
            }

def handler(event, context):
    """Main Netlify serverless entry point with full exception capture."""
    try:
        return _execute(event, context)
    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"[Netlify Function Error]: {err_msg}", flush=True)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "text/html; charset=utf-8"},
            "body": f"""<!DOCTYPE html>
<html>
<head><title>BinSync Server Error</title><style>body{{font-family:sans-serif;padding:30px;line-height:1.6;background:#F8FAFC;color:#0F172A}}pre{{background:#0F172A;color:#38BDF8;padding:16px;border-radius:12px;overflow:auto}}</style></head>
<body>
    <h2>BinSync Serverless Execution Error</h2>
    <p>A runtime exception occurred while processing the request:</p>
    <pre>{err_msg}</pre>
</body>
</html>"""
        }
