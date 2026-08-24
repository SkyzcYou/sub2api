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
- Version: `0.1.181`
- Source revision: `e30521eae1b3e10f15b198a34f9828551b6a3b7a`
- Platform: `linux/amd64`
- Local image ID: `sha256:c2a14a39a2326c2478ec85827183514b5eb10ebf9c9044190372265404826e37`
- Local image size: `138747233` bytes
- ACR manifest digest: `sha256:e76d3274d3472e52600f1a6e49e699cc48b2906c9a28f3e4d44397a4108bc888`
