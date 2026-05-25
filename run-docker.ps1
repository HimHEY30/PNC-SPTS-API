$env:DOCKER_CONFIG = Join-Path -Path (Get-Location) -ChildPath '.dockerconfig'
docker compose up -d
