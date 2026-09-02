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
- Version: `0.2.0`
- Source revision: `1f0020c95a9822cffcea4414bcbc0f910e181056`
- Platform: `linux/amd64`
- Local image ID: `sha256:f3bfe6a96656652b02138316e954a4fcc9a034cfd8597473e1832d48523fc76a`
- Local image size: `139256316` bytes
- ACR manifest digest: `sha256:0475f979db23244aa1760b838cf991d9bdd0ab4777284b98dfe989a976eda747`
- Published at: `2026-09-02`
- Production deployment: not updated or restarted by this build/push operation
