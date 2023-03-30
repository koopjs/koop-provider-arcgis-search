On branch `main`
- bump version in `package.json`
- run `npm i` to update `package-lock.json`
- if it exists, update "Unreleased" header in `CHANGELOG.md` to the new version number
- commit with a message `:package: <version-number>`. (example `":package: 1.0.2"`)
- push the commit to `main`
- run [`gh-release`](https://github.com/hypermodules/gh-release) (may need to install)
- `npm run release`