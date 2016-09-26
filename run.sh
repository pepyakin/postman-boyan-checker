docker build -t knord/postman-boyan-checker .
docker run -v /data:/data -p 3000:3000 -it --rm knord/postman-boyan-checker
