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
- Source revision: working tree (includes independent `site_favicon` settings)
- Local image ID: `sha256:e6de38b5c4e3d607f4b4fd42c83a5488c8b88ea20d6187cb7b1663fdc47f632b`
- Local image size: `132778675` bytes
- ACR manifest digest: `sha256:6da64017f8a23f9a7165591555d13a2a2d668c2d4ed1184c1f48a0f62f6b5400`
