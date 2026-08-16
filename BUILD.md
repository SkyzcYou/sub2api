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

docker build \
  --build-arg VERSION=0.1.177 \
  --build-arg GOLANG_IMAGE=golang:1.26.6-alpine \
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
- Version: `0.1.177`
- Source revision: `07eef8e66f1636da31f4ed7e9949d723951258dd`
- Platform: `linux/amd64`
- Local image ID: `sha256:0c6671dbf7d944b3a83d16b5cf9a804a8424e1c93b5995b38d538d45c9bd7ed6`
- Local image size: `133614939` bytes
- ACR manifest digest: `sha256:ce309557f55538654a76708efa283d0efd9f1812e1965a50131e6724b37414c3`
