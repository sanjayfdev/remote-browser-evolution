<!-- build docker image -->
docker build -f docker/Dockerfile -t remote-browser .

<!-- run docker  -->
docker run -p 3000:3000 -p 6080:6080 remote-browser

