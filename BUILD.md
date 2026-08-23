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
  --build-arg VERSION=0.1.179 \
  --build-arg COMMIT=82cd0c0353f168bb1cf3a535271665fd6cef11b0 \
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
- Version: `0.1.179`
- Source revision: `82cd0c0353f168bb1cf3a535271665fd6cef11b0`
- Platform: `linux/amd64`
- Local image ID: `sha256:9c86a6877120f75678e5f4dcc2cbf2697603ff1c41181acddab9a4874a4ec6e3`
- Local image size: `134884699` bytes
- ACR manifest digest: `sha256:b843bcbfb3028176c0fccf7b75af5955617f106717991dd39eece425d16b91fb`
