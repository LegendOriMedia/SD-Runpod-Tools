import argparse
import requests
import os

parser = argparse.ArgumentParser()
parser.add_argument('--sd-path', default='/workspace/stable-diffusion-webui/', help='Path to Stable Diffusion installation')
args = parser.parse_args()

sd_path = args.sd_path

# Save remote file
url = 'https://raw.githubusercontent.com/LegendOriMedia/SD-Runpod-Tools/main/Favicons/s10.ico'
response = requests.get(url)
with open(os.path.join(sd_path, 'favicon.ico'), 'wb') as f:
    f.write(response.content)

# Modify webui.py
webui_path = os.path.join(sd_path, 'webui.py')
with open(webui_path, 'r') as f:
    lines = f.readlines()

found = False
for i, line in enumerate(lines):
    if 'prevent_thread_lock=True,' in line:
        # Check if the next line contains the desired favicon_path
        if i+1 < len(lines) and 'favicon_path="favicon.ico",' in lines[i+1]:
            found = True
            break
        else:
            lines.insert(i+1, '            favicon_path="favicon.ico",\n')  # Adjust the indentation level according to your webui.py file

if not found:
    with open(webui_path, 'w') as f:
        f.writelines(lines)