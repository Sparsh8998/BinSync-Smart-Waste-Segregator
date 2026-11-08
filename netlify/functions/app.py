import sys
import os
import urllib.parse
from pathlib import Path

# Set serverless environment flags
os.environ["NETLIFY"] = "true"

# Add current directory, parent directories, and /var/task to sys.path
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent.parent
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(root_dir))
if os.path.exists("/var/task"):
    sys.path.insert(0, "/var/task")

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
    if path.startswith('/.netlify/functions/app'):
        path = path[len('/.netlify/functions/app'):] or '/'
    return path

try:
    from serverless_wsgi import handle as handle_wsgi
    def handler(event, context):
        event['path'] = normalize_event_path(event)
        return handle_wsgi(app, event, context)
except ImportError:
    import base64

    def handler(event, context):
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
