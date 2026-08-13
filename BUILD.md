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
- Version: `0.1.176`
- Source revision: `02f5182cf78249c51e996b05dbf438c2374c9e7a`
- Platform: `linux/amd64`
- Local image ID: `sha256:a2923c6d2d8abe8a193196e5303014bc33c21e5b3ad239b7d71023d828a666c7`
- Local image size: `133479091` bytes
- ACR manifest digest: `sha256:68915362b658be8603c18004403bcc333fbb3459f14e1d8415481f75e0888572`
