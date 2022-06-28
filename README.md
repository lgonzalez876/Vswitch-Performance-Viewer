# Vswitch-Performance-Viewer
## Prerequisites
To build this project, you'll need to install [node.js](https://nodejs.org/en/download/)
After installing node, run the following command to install the node modules this widget depends on:
```
npm install
```

## Build Commands
Once node.js and all required node modules have been installed, the widget can be built by running the following script:
```
.\util\build.ps1
``` 
The widget can then be deployed by uploading the resultant `.vsix` file at [this](https://marketplace.visualstudio.com/manage/publishers/lucianogonzalez) website. 
### Useful Links
[Build instructions](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?toc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Ftoc.json&bc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Fbreadcrumb%2Ftoc.json&view=azure-devops)

[Original repo](https://github.com/microsoft/vsts-extension-samples) 
