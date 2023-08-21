import argparse
import requests
import os

parser = argparse.ArgumentParser()
parser.add_argument('--sd-path', default='/workspace/stable-diffusion-webui/', help='Path to Stable Diffusion installation')
args = parser.parse_args()

sd_path = args.sd_path

# Save remote file
url = 'https://github.com/LegendOriMedia/SD-Runpod-Tools/blob/main/Favicons/s10.ico'
response = requests.get(url)
with open(os.path.join(sd_path, 'favicon.ico'), 'wb') as f:
    f.write(response.content)

# Modify webui.py
with open(os.path.join(sd_path, 'webui.py'), 'r') as f:
    lines = f.readlines()

found = False
for i, line in enumerate(lines):
    if 'favicon_path="favicon.ico",' in line:
        found = True
        break
    if 'prevent_thread_lock=True,' in line:
        lines.insert(i+1, 'favicon_path="favicon.ico",\n')
        break

if not found:
    with open(os.path.join(sd_path, 'webui.py'), 'w') as f:
        f.writelines(lines)
