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
The widget can then be deployed by uploading the resultant `.vsix` file at [this](https://marketplace.visualstudio.com/manage/publishers/lucianogonzalez) website. You'll need to be added as a member of the Network Virtualization Publisher on the Visual Studio Marketplace. To do so, please contact the publisher's owner at lgonzalez@microsoft.com.

### APIs/Libraries Used
[List Pipeline Runs](https://docs.microsoft.com/en-us/rest/api/azure/devops/pipelines/runs/list?view=azure-devops-rest-6.0) 

[Get Pipeline Artifacts](https://docs.microsoft.com/en-us/rest/api/azure/devops/pipelines/artifacts/get?view=azure-devops-rest-6.0)

[ChartJS](https://www.chartjs.org/)

#### More Links
[Developing ADO Extensions](https://docs.microsoft.com/en-us/azure/devops/extend/overview?toc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Ftoc.json&bc=%2Fazure%2Fdevops%2Fmarketplace-extensibility%2Fbreadcrumb%2Ftoc.json&view=azure-devops)
