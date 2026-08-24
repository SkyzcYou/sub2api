# Build and Publish to Alibaba Cloud ACR

## Target

- Registry: `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com`
- Namespace and repository: `skyzcstack/xingliux`
- Image: `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`
- Platform: `linux/amd64`

## Prerequisites

Run the commands from the repository root with Docker installed. Use the
Container Registry access credential for Alibaba Cloud account `15985428639`.
Do not put the credential in this repository or shell history.

## Login

```bash
export ACR_REGISTRY=crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com
docker login --username=15985428639 "$ACR_REGISTRY"
```

Docker prompts for the Container Registry credential password.

## Build and Push

```bash
export ACR_REGISTRY=crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com
export IMAGE="$ACR_REGISTRY/skyzcstack/xingliux"
export VERSION="$(tr -d '\r\n' < backend/cmd/server/VERSION)"
export COMMIT="$(git rev-parse HEAD)"

docker build \
  --build-arg VERSION="$VERSION" \
  --build-arg COMMIT="$COMMIT" \
  --build-arg GOLANG_IMAGE=golang:1.27.0-alpine \
  --build-arg NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
  -t "$IMAGE:latest" \
  .

docker push "$IMAGE:latest"
```

The npm registry build argument is optional, but was used for this build to
avoid an unreliable dependency download from the default registry.

## Verify

```bash
docker buildx imagetools inspect "$IMAGE:latest"
docker pull "$IMAGE:latest"
```

## Published Build

- Source branch: `xingliux`
- Version: `0.1.179`
- Source revision: `f5e3043116f6f3e3fb638aa6511d9ce60970593c`
- Platform: `linux/amd64`
- Local image ID: `sha256:32abfb50690d89f9330d3fe99f5ee9b5278220d54ed2503518668c90a6917699`
- Local image size: `134884699` bytes
- ACR manifest digest: `sha256:1c011156f1f7118a139153e043d1bcadf936f3f8e7a3f7de4e616e5cfcd7de7d`
