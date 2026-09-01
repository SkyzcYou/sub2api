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
  --platform linux/amd64 \
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
- Version: `0.1.184`
- Source revision: `b9728bab9a5e2734af74e44ab6824881c589591e`
- Platform: `linux/amd64`
- Local image ID: `sha256:b9ae05328b2c08f3ca24d3c39e59cce4266e5a687b1d4e00f40b5008b93674be`
- Local image size: `139133436` bytes
- ACR manifest digest: `sha256:be4719673891de9015a622e4657fab467f68f85d13de4f89f403646138aa4816`
- Published at: `2026-09-01`
- Production deployment: not updated or restarted by this build/push operation
