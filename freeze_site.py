import os
import shutil
from app import app

def freeze():
    print("Initializing Flask test client to freeze static HTML...")
    client = app.test_client()
    output_dir = os.path.abspath('public')
    os.makedirs(output_dir, exist_ok=True)

    routes = [
        ('/', 'index.html'),
        ('/classifier', 'classifier/index.html'),
        ('/dashboard', 'dashboard/index.html'),
        ('/leaderboard', 'leaderboard/index.html'),
        ('/classifications', 'classifications/index.html'),
        ('/rules', 'rules/index.html'),
        ('/login', 'login/index.html'),
        ('/manifest.json', 'manifest.json'),
        ('/sw.js', 'sw.js')
    ]

    for route, filename in routes:
        print(f"Freezing route: {route} -> {filename}")
        res = client.get(route)
        if res.status_code == 200:
            target_path = os.path.join(output_dir, filename)
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            with open(target_path, 'wb') as f:
                f.write(res.get_data())
            
            # Also create flat filename e.g. classifier.html so both /classifier and /classifier.html resolve
            if '/' in filename and filename.endswith('/index.html'):
                flat_name = filename.split('/')[0] + '.html'
                with open(os.path.join(output_dir, flat_name), 'wb') as f:
                    f.write(res.get_data())
        else:
            print(f"Error: route {route} returned status {res.status_code}")

    # Copy static assets into public/static
    static_src = os.path.abspath('static')
    static_dst = os.path.join(output_dir, 'static')
    if os.path.exists(static_src):
        if os.path.exists(static_dst):
            shutil.rmtree(static_dst)
        shutil.copytree(static_src, static_dst)
        print("Copied static assets to public/static.")

    # Generate _redirects for Netlify
    redirects_content = """# Netlify Redirects & Clean URL Routing
/static/*          /static/:splat               200

# Route Clean URLs
/classifier        /classifier/index.html        200
/dashboard         /dashboard/index.html         200
/leaderboard       /leaderboard/index.html       200
/classifications   /classifications/index.html   200
/rules             /rules/index.html             200
/login             /login/index.html             200

# Single Page App fallback
/*                 /index.html                   200
"""
    with open(os.path.join(output_dir, '_redirects'), 'w') as f:
        f.write(redirects_content)
    with open('_redirects', 'w') as f:
        f.write(redirects_content)

    print("Site successfully frozen into public/ directory!")

if __name__ == '__main__':
    freeze()
