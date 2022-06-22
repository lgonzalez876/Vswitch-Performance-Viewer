# Vswitch-Performance-Viewer
## Build Commands
Run these in the provided order, from within the root directory of the repo.
```
npx webpack --config webpack.config.js
browserify .\dist\main.js > .\dist\bundle.js
npx tfx-cli extension create --rev-version
```

The resulting extension file is then depolyed at [this](https://marketplace.visualstudio.com/manage/publishers/lucianogonzalez) website. 
### Useful Links
[Build instructions](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?toc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Ftoc.json&bc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Fbreadcrumb%2Ftoc.json&view=azure-devops)

[Original repo](https://github.com/microsoft/vsts-extension-samples) 
