import sys
import os
from pathlib import Path

# Set serverless environment flags
os.environ["NETLIFY"] = "true"

# Add project root directory to Python path
root_path = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_path))

from app import app

try:
    from serverless_wsgi import handle as handle_wsgi
    def handler(event, context):
        return handle_wsgi(app, event, context)
except ImportError:
    # High-performance native WSGI adapter for Netlify Functions when serverless_wsgi is not loaded
    import base64
    import urllib.parse

    def handler(event, context):
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Strip Netlify function prefix if route is invoked directly
        if path.startswith('/.netlify/functions/app'):
            path = path[len('/.netlify/functions/app'):] or '/'
        
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

