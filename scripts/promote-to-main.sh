#!/usr/bin/env bash
# Prepara a promoção de `develop` pra `main` (branch de produção) como um
# Pull Request de verdade no GitHub, em vez de um push direto — assim dá pra
# revisar e mergear pela UI antes que `release.yml` rode o semantic-release
# real em `main` e a Vercel publique em produção.
#
# CHANGELOG.md e package.json são versionados de forma independente em cada
# branch pelo semantic-release (develop gera pré-releases, main gera
# releases reais) — por serem arquivos GERADOS, em caso de conflito a
# resolução correta é sempre ficar com a versão de `main` ("ours"), já que
# o semantic-release recalcula o conteúdo certo no release real que roda
# logo depois do merge do PR. O merge é feito aqui, numa branch temporária,
# porque o botão "Merge" do GitHub não sabe resolver esses conflitos.
set -euo pipefail

git fetch origin

git checkout develop
git pull origin develop

git checkout main
git pull origin main

if [ "$(git rev-list main..develop --count)" -eq 0 ]; then
  echo "Nada novo em develop pra promover (já está tudo em main)."
  exit 0
fi

branch="promote/develop-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$branch"

set +e
git merge develop --no-commit --no-ff
merge_status=$?
set -e

if [ "$merge_status" -ne 0 ]; then
  echo "Merge com conflitos — resolvendo os esperados (CHANGELOG.md, package.json)..."
  git checkout --ours -- CHANGELOG.md package.json package-lock.json 2>/dev/null || true
  git add CHANGELOG.md package.json package-lock.json 2>/dev/null || true

  remaining=$(git diff --name-only --diff-filter=U)
  if [ -n "$remaining" ]; then
    echo "Sobraram conflitos fora do esperado — resolva manualmente antes de continuar:"
    echo "$remaining"
    exit 1
  fi
fi

git commit -m "chore(release): promove develop para main"
git push origin "$branch"

pr_url=$(gh pr create \
  --base main \
  --head "$branch" \
  --title "chore(release): promove develop para main" \
  --body "PR automático gerado por \`scripts/promote-to-main.sh\`. Merge (com conflitos esperados já resolvidos) pronto pra revisão — ao mergear, \`release.yml\` roda o semantic-release real em \`main\` e a Vercel publica em produção sozinha.")

git checkout develop
git branch -D "$branch"

echo "PR aberto: $pr_url"
echo "Revise e mergeie pelo GitHub — o merge em main vai disparar o Release e a Vercel."
