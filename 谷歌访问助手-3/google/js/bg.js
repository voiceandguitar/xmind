/* Core */
var mzk_config = {
    base_domain: "https://service.shyonghui.xyz/",
    app_ver: "1.0.0",
    browser_ver:"",
    device_name: "chrome",
    curr_server_id: "",
    lang:chrome.i18n.getUILanguage(),
    'notice' : {title:"点这里绑定邮箱,送VIP 解锁更多网站。",url:"login.html"},
    api_ver:"1.0",
    uninstall_url: "https://www.wenjuan.com/s/2yUbm2/",
    is_ff_privateBrowsingAllowed:false
};


var mzk_pac_config = {
    cnips : {
        data : [],
        last_update: "20200108",
    },
    system_proxydomain : {
        data : [],
        last_update: "20200206",
    },
    direct_domain : {
        data : [],
        last_update: "20200401",
    },
    free_proxydomain : {
        data : [],
        last_update: "20200206",
    },
    user_custom_proxydomain : {
        data : [],
        last_update: "20200108",
    },
    user_custom_bypassdomain : {
        data : [],
        last_update: "20200210",
    },
    geoip_data:"",
    smart_pac_template:"",
    smart_online_template:{
        data:"",
        last_update: "20200224",
    },
    free_pac_template:"",
    global_pac_template:"",
    testdomain:{},
    test_pac_domain:[],
    auto_test_server_rank:[],
    geoip_switch : true,
};

var mzk_user_token = "";
var mzk_is_connect = false;
var mzk_select_server_info = false;
var mzk_connect_mode = "smart";
var mzk_user_info = {};
var mzk_server_id = '';

// 初始化
chrome.storage.local.get(['mzk_is_connect',"mzk_server_id", 'mzk_select_server_info','uinfo',"mzk_geoip_switch"], function (result) {
    // if (result.mzk_connect_mode) {
    //     mzk_connect_mode = result.mzk_connect_mode;
    // }
    Mzk_iTestSpeed.GetCurrentIpinfo();
    mzk_is_connect = result.mzk_is_connect;
    mzk_server_id = result.mzk_server_id;
    if (result.mzk_select_server_info) {
        mzk_select_server_info = result.mzk_select_server_info;
    }

    if(typeof result.mzk_geoip_switch !== "undefined"){
        mzk_pac_config.geoip_switch = result.mzk_geoip_switch;
    }

    if(result.uinfo) {
        mzk_user_info = JSON.parse(result.uinfo);
    }

    var browser_ver = getFirefoxVersion();
    if(browser_ver) {
        mzk_config.device_name = "firefox";
        mzk_config.browser_ver = browser_ver;
        check_firefox_privateBrowsingAllowed();
    }else if(navigator.userAgent.match(/Edg\/([0-9]+)\./)){
        browser_ver = getEdgeVersion();
        mzk_config.device_name = "edge";
        mzk_config.browser_ver = browser_ver;
    }else if(navigator.userAgent.match(/OPR\/([0-9]+)\./)){
        browser_ver = getOperaVersion();
        mzk_config.device_name = "opera";
        mzk_config.browser_ver = browser_ver;
    }else{
        mzk_config.browser_ver = getChromeVersion();
    }

    var Manifest = chrome.runtime.getManifest();
    mzk_config.app_ver = Manifest.version;

    get_user_token(function(){
        load_default_data();
        if(mzk_is_connect) {
            open_vpn();
        }
        mzk_config.uninstall_url = mzk_config.base_domain + "chromeext/muser/uninstall/token/" + mzk_user_token;
        set_mzk_UninstallURL();
    });
});

function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
}

function getFirefoxVersion () {     
    var raw = navigator.userAgent.match(/Firefox\/([0-9]+)\./);
    return raw ? parseInt(raw[1], 10) : false;
}

function getEdgeVersion () {     
    var raw = navigator.userAgent.match(/Edg\/([0-9]+)\./);
    return raw ? parseInt(raw[1], 10) : false;
}

function getOperaVersion () {     
    var raw = navigator.userAgent.match(/OPR\/([0-9]+)\./);
    return raw ? parseInt(raw[1], 10) : false;
}

function set_mzk_UninstallURL(){
    if(typeof browser !== "undefined" && typeof browser.runtime.setUninstallURL !== "undefined"){
        var settingUrl = browser.runtime.setUninstallURL(mzk_config.uninstall_url);
    }else if(typeof chrome.runtime.setUninstallURL !== "undefined"){
        chrome.runtime.setUninstallURL(mzk_config.uninstall_url);
    }
};
set_mzk_UninstallURL();

function user_uninstall(){
    if(typeof mzk_user_info.u_type !== "undefined" && mzk_user_info.u_type === "parent") {
        user_logout();
    }
}

function load_default_data(){
    get_localdb_cache("proxydomain",mzk_pac_config.system_proxydomain,function(data){ mzk_pac_config.system_proxydomain = data;});
    get_localdb_cache("freedomain",mzk_pac_config.free_proxydomain,function(data){ mzk_pac_config.free_proxydomain = data;});
    get_localdb_cache("directdomain",mzk_pac_config.direct_domain,function(data){ mzk_pac_config.direct_domain = data;});
    if(localStorage.getItem("localcache_usercustomdomain")) {
        var custom_data = JSON.parse(localStorage.getItem("localcache_usercustomdomain"));
        custom_data.data = JSON.parse(atob(custom_data.data));
        mzk_pac_config.user_custom_proxydomain.data = custom_data.data;
    }
    
    if(localStorage.getItem("localcache_userbypassdomain")) {
        var custom_data = JSON.parse(localStorage.getItem("localcache_userbypassdomain"));
        custom_data.data = JSON.parse(atob(custom_data.data));
        mzk_pac_config.user_custom_bypassdomain.data = custom_data.data;
    }
    $.get(chrome.extension.getURL("/localdb/smart_pac_v2"),function(data){
        mzk_pac_config.smart_pac_template = data;
    });

    $.get(chrome.extension.getURL("/localdb/geoip.txt"),function(data){
        mzk_pac_config.geoip_data = data;
    });

    $.get(chrome.extension.getURL("/localdb/free-pac-template"),function(data){
        mzk_pac_config.free_pac_template = data;
    });

    $.get(chrome.extension.getURL("/localdb/global-pac-template"),function(data){
        mzk_pac_config.global_pac_template = data;
    });
}

function get_localdb_cache(key , localdata , _rcallback){
    var cache_str = localStorage.getItem("localcache_"+key);
    if(cache_str) {
        localdata = JSON.parse(cache_str);
        localdata.data = JSON.parse(atob(localdata.data));
        if (_rcallback) 
            _rcallback(localdata);
    }else{
        $.get(chrome.extension.getURL("/localdb/"+key+".txt"),function(data){
            localdata.data = JSON.parse(atob(data));
            set_localdb_cache(key,data,localdata.last_update);
            if (_rcallback) 
                _rcallback(localdata);
        });
    }
}

function set_localdb_cache(key , data , update){
    localStorage.setItem("localcache_"+key,JSON.stringify({data:data,last_update:update}));
}

function update_onlinedata_tolocal(datakey,_rcallback){
    MZK_getJSON_DATA("chromeext/index/get_domain_list", {list_type:datakey},
            function (data) {
                if (data.result == 'ok') {
                    if (_rcallback) {
                        _rcallback(data[datakey]);
                    }
                }
            }
    );
}


// 核心监听
chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.cmd == "get_base_domain") {
                sendResponse({url: mzk_config.base_domain});
            } else if (request.cmd == "check_proxy_permissions") { // 检测冲突app
                sendResponse({result: 'ok'});
                check_proxy_permissions();
            }  else {
                sendResponse({result: "error", message: "Invalid 'cmd'"});
            }
            return true;
        });

var mzk_backup_server = [
    "https://service.shyonghui.xyz/",
    "https://service.qqwx6.xyz:8443/",
    "https://api.mzkservice.com/",
    "http://150.109.109.152:488/",
];        
function MZK_getJSON_DATA(API, send_data, _rcallback) {
    if (!send_data)
        send_data = {};
    send_data.appver = mzk_config.app_ver;
    send_data.device_name = mzk_config.device_name;
    send_data.token = mzk_user_token;
    send_data.curr_server_id = mzk_config.curr_server_id;
    send_data.runtime_id = chrome.runtime.id;
    send_data.lang = mzk_config.lang;
    $.ajax({
            url: mzk_config.base_domain + API,
            type : 'POST', 
            dataType: "json",
            data: send_data,
            tryCount : 0,
            retryLimit : 4,
            success : function (data) {
                if(typeof data.msgtype !== "undefined" && typeof data.msgdata !== "undefined" && data.msgtype == "Encrypt"){
                    data = JSON.parse(CryptoJSAesDecrypt(data.msgdata));
                }
                if (_rcallback) {
                    _rcallback(data);
                }
            },
            error : function(xhr, textStatus, errorThrown ) {
                var err = textStatus + ", " + errorThrown;
                console.log("Err:" + err);
                this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        this.url = mzk_backup_server[this.tryCount] + API;
                        $.ajax(this);
                        return;
                    }else{
                        if(!/getsession/igm.test(API)) {
                            var err = textStatus + ", " + errorThrown;
                            show_notifications_msg('network_error_'+Math.random(),get_lan_msg("error_network"));
                        }
                    }            
                    return;
            }
        });
}

function CryptoJSAesDecrypt(encrypted_json_string){
    var obj_json = JSON.parse(encrypted_json_string);
    var encrypted = obj_json.ciphertext;
    var salt = CryptoJS.enc.Hex.parse(obj_json.salt);
    var iv = CryptoJS.enc.Hex.parse(obj_json.iv);   
    var key = CryptoJS.PBKDF2(mzk_user_token, salt, { hasher: CryptoJS.algo.SHA512, keySize: 64/8, iterations: 999});
    var decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv});
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function get_user_token(_acallback) {
    chrome.storage.local.get(['mzk_token','uinfo'], function (result) {
        if (!result.mzk_token || !result.uinfo) {
            
            auto_register(function () {
                if (_acallback)
                    _acallback();
            });
        } else if (_acallback)
            _acallback();
        mzk_user_token = result.mzk_token;
    });
}

function auto_register(_acallback) {
    var reg_hash = md5(chrome.runtime.id + navigator.userAgent);
    MZK_getJSON_DATA("chromeext/muser/auto_login", {reg_hash:reg_hash},
            function (data) {
                if (data.result == 'ok') {
                    chrome.storage.local.set({mzk_token: data.token_key , uinfo:JSON.stringify(data.uinfo)}, function () {
                        if (_acallback)
                            _acallback();
                    });
                    mzk_user_token = data.token_key;
                    mzk_user_info = data.uinfo;
                    mzk_select_server_info = false;
                    mzk_server_id = '';
                }
            }
    );
}

function user_logout(_acallback) {
    MZK_getJSON_DATA("chromeext/muser/logout", {},
            function (data) {
                close_vpn(function () {
                    chrome.storage.local.remove(['uinfo', 'mzk_select_server_info', 'mzk_is_connect', 'mzk_connect_mode'], function () {
                        if (_acallback)
                            _acallback();
                        if (data.result == 'ok' && typeof data.uinfo.username !== "undefined") {
                            chrome.storage.local.set({uinfo:JSON.stringify(data.uinfo)});
                            mzk_user_info = data.uinfo;
                            mzk_select_server_info = false;
                            mzk_server_id = '';
                        }else{
                            auto_register();
                        }
                    });
                });
            }
    );
}


var calls = {};
var DEFAULT_RETRY_ATTEMPTS = 5;
chrome.webRequest.onAuthRequired.addListener(
        function (details) {
            var idstr = details.requestId.toString();
            if (details.isProxy === true) {
                if (!(idstr in calls)) {
                    calls[idstr] = 0;
                }
                calls[idstr] = calls[idstr] + 1;
                var retry = parseInt(localStorage["proxy_retry"]) || DEFAULT_RETRY_ATTEMPTS || 5;
                if (calls[idstr] >= retry) {
                    //show_notifications_msg('proxy_auth_error', get_lan_msg("proxy_auth_error"));
                    calls = {};
                    return({
                        cancel: true
                    });
                }
                var username = "";
                var password = "";
                if(typeof mzk_user_info.p_user !== "undefined"){
                    username = mzk_user_info.p_user;
                    password = mzk_user_info.p_pass;
                }else if(typeof mzk_select_server_info.p_user !== "undefined"){
                    username = mzk_select_server_info.p_user;
                    password = mzk_select_server_info.p_pass;
                }else{
                    db_select_server = localStorage.getItem("select_server");
                    if(db_select_server){
                        db_select_server = JSON.parse(decodeURIComponent(btoa(db_select_server)));
                        username = db_auth.p_user;
                        password = db_auth.p_pass;
                    }
                }
                if (username && password) {
                    return({
                        authCredentials: {
                            'username': username,
                            'password': password
                        }
                    });
                }
            }
        },
        {urls: ["<all_urls>"]},["blocking"]
        );

function goto_vip_tips_func(details){
    var redirectUrl = chrome.extension.getURL("/helper/only_vip_site.html");
    if(details.type == "main_frame") {
        if(mzk_config.device_name == "firefox") {
            chrome.tabs.create({
                url: redirectUrl
            });
            return {cancel:true};    
        } else return {redirectUrl: redirectUrl};
    }else {
        return {cancel:true};
    }
}        

function enable_vip_site_tips(){
    if(mzk_user_info.is_vip) {
        disabled_vip_site_tips();
        return;
    }
    if(typeof Mzk_iTestSpeed.ipinfo !== "undefined" && typeof Mzk_iTestSpeed.ipinfo.data !== "undefined" && typeof Mzk_iTestSpeed.ipinfo.data.country !== "undefined" && Mzk_iTestSpeed.ipinfo.data.country != "中国") {
        disabled_vip_site_tips();
        return;
    }
    if(chrome.webRequest.onBeforeRequest.hasListener(goto_vip_tips_func)) {
        return;
    }
    chrome.webRequest.onBeforeRequest.addListener(
        goto_vip_tips_func,
        {
          urls: [
              "*://*.facebook.com/*",
              "*://twitter.com/*",
              "*://drive.google.com/*",
              "*://*.youtube.com/*"
          ]
        },
        ["blocking"]
      );
 }
 
 function disabled_vip_site_tips(){
    if(chrome.webRequest.onBeforeRequest.hasListener(goto_vip_tips_func)) {
        chrome.webRequest.onBeforeRequest.removeListener(goto_vip_tips_func);
    }
 }

class Mzk_Kepplive_Service{
    // 同步各种离线数据
    static sync_online_data(syncdata){
        if(syncdata.free_doamin_update !== mzk_pac_config.free_proxydomain.last_update) {
            update_onlinedata_tolocal("freedomain",function(domain_data){
                mzk_pac_config.free_proxydomain.last_update = syncdata.free_doamin_update;
                mzk_pac_config.free_proxydomain.data = domain_data;
                set_localdb_cache("freedomain",btoa(JSON.stringify(domain_data)),mzk_pac_config.free_proxydomain.last_update);
            });
        }

        if(syncdata.system_proxy_doamin_update !== mzk_pac_config.system_proxydomain.last_update) {
            update_onlinedata_tolocal("proxydomain",function(domain_data){
                mzk_pac_config.system_proxydomain.last_update = syncdata.system_proxy_doamin_update;
                mzk_pac_config.system_proxydomain.data = domain_data;
                set_localdb_cache("proxydomain",btoa(JSON.stringify(domain_data)),mzk_pac_config.system_proxydomain.last_update);
            });
        }

        if(syncdata.user_custom_doamin_update !== mzk_pac_config.user_custom_proxydomain.last_update) {
            update_onlinedata_tolocal("usercustomdomain",function(domain_data){
                mzk_pac_config.user_custom_proxydomain.last_update = syncdata.user_custom_doamin_update;
                mzk_pac_config.user_custom_proxydomain.data = domain_data;
                set_localdb_cache("usercustomdomain",btoa(JSON.stringify(domain_data)),mzk_pac_config.user_custom_proxydomain.last_update);
            });
        }

        if(syncdata.direct_doamin_update !== mzk_pac_config.direct_domain.last_update) {
            update_onlinedata_tolocal("directdomain",function(domain_data){
                mzk_pac_config.direct_domain.last_update = syncdata.direct_doamin_update;
                mzk_pac_config.direct_domain.data = domain_data;
                set_localdb_cache("directdomain",btoa(JSON.stringify(domain_data)),mzk_pac_config.direct_domain.last_update);
            });
        }

        if(syncdata.custom_bypassdoamin_update !== mzk_pac_config.user_custom_bypassdomain.last_update) {
            update_onlinedata_tolocal("userbypasstdomain",function(domain_data){
                mzk_pac_config.user_custom_bypassdomain.last_update = syncdata.custom_bypassdoamin_update;
                mzk_pac_config.user_custom_bypassdomain.data = domain_data;
                set_localdb_cache("userbypasstdomain",btoa(JSON.stringify(domain_data)),mzk_pac_config.user_custom_bypassdomain.last_update);
            });
        }

        if(mzk_select_server_info.line_mode == "smart" && mzk_user_info.is_vip && mzk_config.device_name != "firefox") {
            if(syncdata.smart_pac_update != mzk_pac_config.smart_online_template.last_update || !mzk_pac_config.smart_online_template.data) {
                mzk_pac_config.smart_online_template.last_update = syncdata.smart_pac_update;
                Mzk_Kepplive_Service.sync_online_pactpl();
            }
        }
    }

    // 同步当前服务器信息
    static sync_current_server_info(sid){
        if(mzk_select_server_info) {
            MZK_getJSON_DATA("chromeext/index/get_server_info", {sid:sid}, function (data) {
                if (data.result == "ok") {
                    if(typeof data.server.line_sn === "undefined"){
                        get_default_server(function(){
                            if(mzk_is_connect) open_vpn();
                        });
                    }else{
                        mzk_select_server_info = data.server;
                        chrome.storage.local.set({mzk_select_server_info: data.server}, function () {
                            mzk_server_id = data.server.line_sn;
                            mzk_select_server_info = data.server;
                            if(mzk_is_connect) open_vpn();
                        });
                    }
                } 
            });
        }
    }

    // 保存测速服务器域名
    static sync_testdomain(auto_test_server){
        mzk_pac_config.testdomain = auto_test_server;
        var test_pac_domain = {};
        $.each(auto_test_server,function(i,k){
            test_pac_domain[k.testdomain] = k.server;
        });
        mzk_pac_config.test_pac_domain = test_pac_domain;
        open_vpn(function(){
            Mzk_iTestSpeed.Start();
        });
    }

    static sync_online_pactpl(){
        MZK_getJSON_DATA("chromeext/pac/show", {sid:mzk_select_server_info.line_sn,pmode:"smart",gettpl:1,ipinfo:JSON.stringify(Mzk_iTestSpeed.ipinfo)}, function (data) {
            mzk_pac_config.smart_online_template.data = data.tpl;
        });
    }
}


function KeepLive_Session() {
    if(!mzk_is_connect) return;
    var ipdata = {};
    if(typeof Mzk_iTestSpeed.ipinfo !== "undefined" && typeof Mzk_iTestSpeed.ipinfo.data !== "undefined") ipdata = Mzk_iTestSpeed.ipinfo.data;
    MZK_getJSON_DATA("chromeext/index/getsession/token/"+mzk_user_token+"?appver=" + mzk_config.app_ver, {geoip_info:ipdata}, function (data) {
        if (data.result == "ok") {
            if(data.is_user_change) { // 用户信息发生变化.
                if(!data.uinfo.is_vip && mzk_user_info.is_vip) {
                    get_default_server(function(){
                        open_vpn();
                    });
                }
            }
            chrome.storage.local.set({uinfo: JSON.stringify(data.uinfo)});
            mzk_user_info = data.uinfo;

            if((mzk_select_server_info.vip_level > mzk_user_info.vip_level) || (mzk_user_info.vip_level > 1 && mzk_select_server_info.vip_level < 2)){
                get_default_server(function(){
                    open_vpn();
                });
            }

            mzk_config.notice = data.notice;
            Mzk_Kepplive_Service.sync_online_data(data.syncdata);
            if(mzk_select_server_info && data.server_last_update !== mzk_select_server_info.last_update) {
                Mzk_Kepplive_Service.sync_current_server_info(mzk_select_server_info.line_sn);
            }

            if(data.auto_test_server.length > 0 && mzk_select_server_info.line_mode == "smart") { // 处理测速服务器数据
                Mzk_Kepplive_Service.sync_testdomain(data.auto_test_server);
            }
        } else {
            show_notifications_msg('user_token_error',"您的用户信息有误,请您重新登录.");
            user_logout();
        }
    });
}

function get_default_server(_rcallback) {
    var ipdata = {};
    if(typeof Mzk_iTestSpeed.ipinfo !== "undefined" && typeof Mzk_iTestSpeed.ipinfo.data !== "undefined") ipdata = Mzk_iTestSpeed.ipinfo.data;
    MZK_getJSON_DATA("chromeext/index/get_default_location", {geoip_info:ipdata}, function (data) {
        if (data.result == 'ok') {
            chrome.storage.local.set({mzk_select_server_info: data.server}, function () {
                mzk_server_id = data.server.line_sn;
                mzk_select_server_info = data.server;
                if (_rcallback) {
                    _rcallback();
                }
            });
        } else {
            console.log(data.msg);
        }
    });
}


// 检测 proxy 代理权限  
function check_proxy_permissions() {
    if(mzk_config.device_name === "firefox" && typeof browser !== "undefined") {
        browser.management.getAll(function(ExtensionInfo){
            ExtensionInfo.forEach(check_clash_app);
        });
    }else{
        chrome.proxy.settings.get({
            'incognito': false
        },
        function (proxy_config) {
            if (proxy_config['levelOfControl'] !== 'controlled_by_this_extension') {
                chrome.management.getAll(function(ExtensionInfo){
                    ExtensionInfo.forEach(check_clash_app);
                });
            }
        });
    }
}

// 检测冲突app
function check_clash_app(ExtensionInfo){
    if(typeof ExtensionInfo.permissions !== "undefined"  && ExtensionInfo.permissions.indexOf('proxy') !== -1 && ExtensionInfo.enabled === true && ExtensionInfo.id !== chrome.runtime.id) {
        chrome.management.setEnabled(ExtensionInfo.id,false);
    }
}

function check_firefox_privateBrowsingAllowed(_rcallback){
    chrome.management.get(chrome.runtime.id,function(result){
        mzk_config.is_ff_privateBrowsingAllowed = result.permissions.includes("internal:privateBrowsingAllowed");
        if (_rcallback) {
            _rcallback(data);
        }
    });
}

// 注册定时器
chrome.alarms.create("KeepLive_Session", {delayInMinutes: 60, periodInMinutes: 60});
chrome.alarms.create("KeepLive_Session_Init", {delayInMinutes: 2});

// 定时器监听
chrome.alarms.onAlarm.addListener(function (alarm) {
    switch (alarm.name) {
        case "KeepLive_Session":
        case "KeepLive_Session_Init":
            KeepLive_Session();
            vip_exp_tips();
            break;
        case "TestSpeed_Run":
            Mzk_iTestSpeed.Start(1);
            break;
        case "TestSpeed_ApplyVPN":
            Mzk_iTestSpeed.ApplyVPN();
            break;
        default:
    }
});

function open_vpn(_acallback) {
    applyChanges('production', function () {
        mzk_config.curr_server_id = mzk_server_id;
        mzk_is_connect = true;
        chrome.storage.local.set({mzk_is_connect: true});
        chrome.storage.local.set({mzk_server_id: mzk_server_id});
        set_badge_on();
        localStorage.setItem("select_server",btoa(encodeURIComponent(JSON.stringify(mzk_select_server_info))));
        console.log('vpn Connected');
        enable_vip_site_tips();
        if (_acallback)
            _acallback();
    });
}

function close_vpn(_acallback) {
    applyChanges("system", function () {
        chrome.storage.local.remove("mzk_is_connect");
        mzk_is_connect = false;
        set_badge_off();
        disabled_vip_site_tips();
        if (_acallback)
            _acallback();
        console.log('vpn Disconnect');
    });
}

function onlyUniqueArray(value, index, self) { 
    return self.indexOf(value) === index;
}

function generate_chrome_pacdata(){
    var api_url_info = new URL(mzk_config.base_domain);
    if(mzk_connect_mode == "global" && mzk_user_info.is_vip) {
        var pac_data = mzk_pac_config.global_pac_template;
        var direct_domain = {};
        direct_domain[api_url_info.hostname] = 1;
        pac_data = pac_data.replace('__CN_IPS__','[]');
        pac_data = pac_data.replace('__DIRECT_DOMAINS__',JSON.stringify(direct_domain));
        pac_data = pac_data.replace('__DOMAINS__','{}');
    }else{
        var add_proxy_domains = {};
        var proxy_domains = {};
        if(!mzk_user_info.is_vip) {
            var pac_data = mzk_pac_config.free_pac_template;
            add_proxy_domains = mzk_pac_config.free_proxydomain.data;
            pac_data = pac_data.replace('__DIRECT_DOMAINS__','{}');
            pac_data = pac_data.replace('__CN_IPS__','[]');
        }else{
            if(mzk_pac_config.smart_online_template.data) {
                var pac_data = mzk_pac_config.smart_online_template.data;
            }else{
                var pac_data = mzk_pac_config.smart_pac_template;
            }
            add_proxy_domains = mzk_pac_config.system_proxydomain.data;
            add_proxy_domains = add_proxy_domains.concat(mzk_pac_config.user_custom_proxydomain.data);
            var direct_domain = mzk_pac_config.direct_domain.data;
            if(mzk_pac_config.user_custom_bypassdomain.data.length > 0) {
                direct_domain = direct_domain.concat(mzk_pac_config.user_custom_bypassdomain.data);
            }
            if(!direct_domain.includes(api_url_info.hostname)) direct_domain.push(api_url_info.hostname);
            pac_data = pac_data.replace('__DIRECT_DOMAINS__', JSON.stringify(direct_domain.filter(onlyUniqueArray)));
                        
            if(mzk_pac_config.geoip_switch) {
                pac_data = pac_data.replace('__GEOIP_LIST__', mzk_pac_config.geoip_data);
                pac_data = pac_data.replace('__CN_IPS_SWITCH__', "true");
            }else{
                pac_data = pac_data.replace('__GEOIP_LIST__', '[]');
                pac_data = pac_data.replace('__CN_IPS_SWITCH__', 'false');
            }
        }
        
        pac_data = pac_data.replace('__DOMAINS__', JSON.stringify(add_proxy_domains));
        
    }
    if(Object.keys(mzk_pac_config.test_pac_domain).length > 0) {
        pac_data = pac_data.replace('__TESTDOMAIN__',JSON.stringify(mzk_pac_config.test_pac_domain));
    }else{
        pac_data = pac_data.replace('__TESTDOMAIN__','{}');
    }
    pac_data = pac_data.replace('__PROXY__',mzk_select_server_info.address);
    return pac_data;
}

function applyChanges(mode, cb) {
    switch(mzk_config.device_name) {
        case 'edge':
        case 'chrome':
            var browser_proxy = new Mzk_Chrome_proxy();
            var config = browser_proxy.generateProxyConfig(mode , generate_chrome_pacdata());
            browser_proxy.applyChanges(config,cb);
            break;
        case 'firefox':
            var browser_proxy = new Mzk_Firefox_proxy();
            var pac_url = mzk_config.base_domain + "chromeext/pac/show/token/"+mzk_user_token+"?sid="+mzk_select_server_info.line_sn+"&pmode="+mzk_connect_mode+"&geoip="+mzk_pac_config.geoip_switch+"&rd="+Math.random().toString();
            var config = browser_proxy.generateProxyConfig(mode , pac_url);
            var re = /HTTPS ([^;]+)/g;
            var firefox_server = mzk_select_server_info.address.split(re);
            var ff_info = firefox_server[1].split(":");
            mzk_select_server_info.ff_server = {server:ff_info[0],port:ff_info[1]};
            browser_proxy.applyChanges(config,cb);
            break;
        default:
    }
}

function set_badge_on(){
    chrome.browserAction.setBadgeText({text: 'ON'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#4688F1'});
}

function set_badge_off(){
    chrome.browserAction.setBadgeText({text: 'OFF'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#fa7d3c'});
}

/**
 * 
 * @param string msg_type_id
 * @param string msg
 */
function show_notifications_msg(msg_type_id, msg) {
    //msg_type_id += Math.floor(Math.random() * 1000) + 1;
    chrome.notifications.create(msg_type_id, {
        'type': 'basic',
        'iconUrl': 'img/128ico.png',
        'title': 'IGuGe',
        'message': msg,
        'isClickable': true,
        'priority': 2
    }, function (id) {
        console.log("Last error:", chrome.runtime.lastError);
    });
}

function vip_exp_tips(){
    if(!mzk_user_info.is_vip && mzk_user_info.u_type == "parent") {
        chrome.notifications.create("mzk_vip_is_exp", {
            'type': 'basic',
            'iconUrl': 'img/128ico.png',
            'title': 'VIP已经过期',
            'message': "您的VIP已经过期,只能免费访问谷歌系列网站哦,点此续费.",
            'isClickable': true,
            'priority': 2
        }, function (id) {
            console.log("Last error:", chrome.runtime.lastError);
        });

        chrome.notifications.onClicked.addListener(function(id) {
            chrome.notifications.clear(id);
            chrome.tabs.create({
                url: chrome.extension.getURL("/helper/payment.html?pid=1")
            });
        });
    }
}

// 获取多语言
function get_lan_msg(msgkey , substitutions){
    if(typeof substitutions === "undefined") substitutions = [];
    return chrome.i18n.getMessage(msgkey,substitutions);
}

class Mzk_Chrome_proxy {
    applyChanges(config, cb) {
        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        }, cb);
    }
    
    generateProxyConfig(s_mode , pac_data) {
        switch (s_mode) {
            case 'system':
                return {mode: 'system'}
            case 'production':
                if(!pac_data) {
                    pac_data = atob(window.localStorage.getItem("pac_cache"));
                }else{
                    window.localStorage.setItem("pac_cache",btoa(pac_data));
                }
                if (pac_data)
                return {
                    mode: 'pac_script',
                    pacScript: {
                        data: pac_data,
                        mandatory: true
                    }
                }
        }
        return {mode: 'system'}
    }
};

class Mzk_iTestSpeed {
    static RunTestspeed(){
        if(typeof Mzk_iTestSpeed.task_count === "undefined") Mzk_iTestSpeed.task_count = 0;
        if(Mzk_iTestSpeed.task_count > 0 || mzk_select_server_info.line_mode != "smart") return;
        Mzk_iTestSpeed.task_count = Object.keys(mzk_pac_config.test_pac_domain).length;
        if(Mzk_iTestSpeed.task_count > 0 && mzk_is_connect) {
            var mzk_ping = new Ping({favicon:"/img/128ico.png",timeout:3000});
            mzk_pac_config.auto_test_server_rank = [];
            Mzk_iTestSpeed.top_server = [];
            $.each(mzk_pac_config.testdomain,function(i,k){
                mzk_ping.ping("http://" + k.testdomain,function(err, data){
                    console.log("speed:"+data+" err:"+err);
                    if(err !== null) {
                        mzk_pac_config.auto_test_server_rank.push({server:k.server,ranking:data,result:err});
                    }else{
                        var trank = Math.round(data*k.load);
                        if(trank < 3000) {
                            mzk_pac_config.auto_test_server_rank.push({server:k.server,ranking:data,result:"ok"});
                            Mzk_iTestSpeed.top_server.push({server:k.server,ranking:trank,result:"ok"});
                        }
                    }
                    if(Mzk_iTestSpeed.task_count > 0) Mzk_iTestSpeed.task_count--;
                });
            });
        }
    }

    static Start(times){
        if(typeof mzk_select_server_info.address === "undefined" || mzk_select_server_info.line_mode != "smart" || Mzk_iTestSpeed.task_count > 0) return false;
        Mzk_iTestSpeed.curr_top_ranking_server = undefined;
        Mzk_iTestSpeed.RunTestspeed();
        if(typeof times === "undefined") {
            chrome.alarms.create("TestSpeed_Run", {delayInMinutes: 1});
            if(typeof Mzk_iTestSpeed.ipinfo === "undefined") Mzk_iTestSpeed.GetCurrentIpinfo();
            Mzk_iTestSpeed.last_test_user_isvip  = mzk_user_info.is_vip;
        }else{
            chrome.alarms.create("TestSpeed_ApplyVPN", {delayInMinutes: 1});
        }
    }

    static ApplyVPN(){
        if(Object.keys(mzk_pac_config.auto_test_server_rank).length < 1 || Mzk_iTestSpeed.top_server.length < 2) return;
        if(typeof Mzk_iTestSpeed.last_test_user_isvip !== "undefined" && Mzk_iTestSpeed.last_test_user_isvip  != mzk_user_info.is_vip) return;
        //if(typeof Mzk_iTestSpeed.curr_top_ranking_server !== "undefined" && Mzk_iTestSpeed.curr_top_ranking_server.length == 2 && Mzk_iTestSpeed.curr_top_ranking_server[0].server == Mzk_iTestSpeed.curr_top_ranking_server[1].server) Mzk_iTestSpeed.curr_top_ranking_server =[];
        Mzk_iTestSpeed.top_server.sort(Mzk_iTestSpeed.compare("ranking"));
        Mzk_iTestSpeed.curr_top_ranking_server = Mzk_iTestSpeed.top_server.slice(0,2);

        if(Mzk_iTestSpeed.curr_top_ranking_server[0].server == Mzk_iTestSpeed.curr_top_ranking_server[1].server) {
            Mzk_iTestSpeed.curr_top_ranking_server = undefined;
            return;
        }
        if(Object.keys(Mzk_iTestSpeed.curr_top_ranking_server).length < 2) return;
        var newserver = "HTTPS " + Mzk_iTestSpeed.curr_top_ranking_server[0].server + ";HTTPS " + Mzk_iTestSpeed.curr_top_ranking_server[1].server + ";";
        if(typeof mzk_select_server_info.address !== "undefined" && mzk_select_server_info.line_mode == "smart") {
            if(newserver == mzk_select_server_info.address) return;
            mzk_select_server_info.address = newserver;
            chrome.storage.local.set({mzk_select_server_info: mzk_select_server_info});
            if(mzk_is_connect) {
                Mzk_iTestSpeed.SendReport(function(){
                    open_vpn();
                });
            }
        }
    }

    static SendReport(_rcallback){
        MZK_getJSON_DATA("chromeext/pac/report_testspeed", {ipinfo:JSON.stringify(Mzk_iTestSpeed.ipinfo),sid:mzk_select_server_info.line_sn,report:JSON.stringify(mzk_pac_config.auto_test_server_rank),top_server:JSON.stringify(Mzk_iTestSpeed.curr_top_ranking_server)}, function (data) {
            if (data.result == 'ok') {
                if (_rcallback) {
                    _rcallback();
                }
            } else {
                console.log(data.msg);
            }
        });
    }

    static GetCurrentIpinfo(){
        $.post(
            "http://ip.taobao.com/service/getIpInfo2.php", {ip:"myip"},
            function (data) {
                Mzk_iTestSpeed.ipinfo = data;
                window.localStorage.setItem("geoip_info",JSON.stringify(data));
            },"json").fail(function(){
                var info = window.localStorage.getItem("geoip_info");
                if(info) {
                    Mzk_iTestSpeed.ipinfo = JSON.parse(info);
                }
            });
    }

   static compare(p){ 
        return function(m,n){
            var a = m[p];
            var b = n[p];
            return a - b; 
        }
    }
};

class Mzk_Firefox_proxy {
     applyChanges(config, cb) {
         if(mzk_config.is_ff_privateBrowsingAllowed){
            chrome.proxy.settings.set({
                value: config,
                scope: 'regular'
            }, cb);
            if(browser.proxy.onRequest.hasListener(Mzk_Firefox_proxy.handleProxyRequest)){
                browser.proxy.onRequest.removeListener(Mzk_Firefox_proxy.handleProxyRequest);
            }
         }else {
            if(config.proxyType === "autoConfig") {
                browser.proxy.onRequest.addListener(Mzk_Firefox_proxy.handleProxyRequest, {urls: ["<all_urls>"]});
            }else{
                browser.proxy.onRequest.removeListener(Mzk_Firefox_proxy.handleProxyRequest);
            }   
        }
        if(cb) cb();
    }
    
     generateProxyConfig(s_mode , pac_url) {
        switch (s_mode) {
            case 'system':
                return {proxyType: 'system'}
            case 'production':
                return {
                    proxyType: 'autoConfig',
                    autoConfigUrl: pac_url
                }
        }
    }
      
    static handleProxyRequest(requestInfo) {
        var url_info = new URL(requestInfo.url);
        var api_url_info = new URL(mzk_config.base_domain);
        if(Mzk_Firefox_proxy.isPrivateIp(url_info.hostname)){
            return {type: "direct"};
        }

        if(url_info.hostname === api_url_info.hostname){
            return {type: "direct"};
        }

        if(typeof mzk_pac_config.test_pac_domain[url_info.hostname] !== "undefined") {
            var test_server = mzk_pac_config.test_pac_domain[url_info.hostname].split(":");
            return {type: "https", host: test_server[0], port: test_server[1]};
        }

        if(mzk_connect_mode == "global" && mzk_user_info.is_vip) {
            return {type: "https", host: mzk_select_server_info.ff_server.server, port: mzk_select_server_info.ff_server.port};
        }
        
        if(Mzk_Firefox_proxy.testDomain(url_info.hostname,mzk_pac_config.direct_domain.data)){
            return {type: "direct"};
        }

        if(mzk_pac_config.user_custom_bypassdomain.data.length > 0 && Mzk_Firefox_proxy.testDomain(url_info.hostname,mzk_pac_config.user_custom_bypassdomain.data)){
            return {type: "direct"};
        }

        if(mzk_user_info.is_vip) {
            if(Mzk_Firefox_proxy.testDomain(url_info.hostname,mzk_pac_config.system_proxydomain.data) || Mzk_Firefox_proxy.testDomain(url_info.hostname,mzk_pac_config.user_custom_proxydomain.data)){
                return {type: "https", host: mzk_select_server_info.ff_server.server, port: mzk_select_server_info.ff_server.port};
            }
        }else{
            if(Mzk_Firefox_proxy.testDomain(url_info.hostname,mzk_pac_config.free_proxydomain.data)){
                return {type: "https", host: mzk_select_server_info.ff_server.server, port: mzk_select_server_info.ff_server.port};
            }
        }
        return {type: "direct"};
      }

      static testDomain(target, domains, cnRootIncluded) {
            if(typeof domains === "undefined") return false;
        var idxA = target.lastIndexOf('.');
        var idxB = target.lastIndexOf('.', idxA - 1);
        var suffix = cnRootIncluded ? target.substring(idxA + 1) : '';
        if (suffix === 'cn') {
            return true;
        }
        while (true) {
            if (idxB === -1) {
                if (domains.includes(target)) {
                    return true;
                } else {
                    return false;
                }
            }
            suffix = target.substring(idxB + 1);
            if (domains.includes(suffix)) {
                return true;
            }
            idxB = target.lastIndexOf('.', idxB - 1);
        }
    }

    static isPrivateIp(ip) {
        return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) ||
        /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) ||
        /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) ||
        /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) ||
        /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) ||
        /^f[cd][0-9a-f]{2}:/i.test(ip) ||
        /^fe80:/i.test(ip) ||
        /^::1$/.test(ip) ||
        /^::$/.test(ip);
      }
};
//console.log = function() {}
var Ping=function(a){this.opt=a||{},this.favicon=this.opt.favicon||"/favicon.ico",this.timeout=this.opt.timeout||0,this.logError=this.opt.logError||!1};Ping.prototype.ping=function(a,b){function c(a){f.wasSuccess=!0,e.call(f,a)}function d(a){f.wasSuccess=!1,e.call(f,a)}function e(){g&&clearTimeout(g);var a=new Date-h;if("function"==typeof b)return this.wasSuccess?b(null,a):(f.logError&&console.error("error loading resource"),b("error",a))}var f=this;f.wasSuccess=!1,f.img=new Image,f.img.onload=c,f.img.onerror=d;var g,h=new Date;f.timeout&&(g=setTimeout(function(){e.call(f,void 0)},f.timeout)),f.img.src=a+f.favicon+"?"+ +new Date},"undefined"!=typeof exports?"undefined"!=typeof module&&module.exports&&(module.exports=Ping):window.Ping=Ping;
!function(n){"use strict";function d(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function f(n,t,r,e,o,u){return d(function(n,t){return n<<t|n>>>32-t}(d(d(t,n),d(e,u)),o),r)}function l(n,t,r,e,o,u,c){return f(t&r|~t&e,n,t,o,u,c)}function g(n,t,r,e,o,u,c){return f(t&e|r&~e,n,t,o,u,c)}function v(n,t,r,e,o,u,c){return f(t^r^e,n,t,o,u,c)}function m(n,t,r,e,o,u,c){return f(r^(t|~e),n,t,o,u,c)}function i(n,t){var r,e,o,u,c;n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;var f=1732584193,i=-271733879,a=-1732584194,h=271733878;for(r=0;r<n.length;r+=16)i=m(i=m(i=m(i=m(i=v(i=v(i=v(i=v(i=g(i=g(i=g(i=g(i=l(i=l(i=l(i=l(o=i,a=l(u=a,h=l(c=h,f=l(e=f,i,a,h,n[r],7,-680876936),i,a,n[r+1],12,-389564586),f,i,n[r+2],17,606105819),h,f,n[r+3],22,-1044525330),a=l(a,h=l(h,f=l(f,i,a,h,n[r+4],7,-176418897),i,a,n[r+5],12,1200080426),f,i,n[r+6],17,-1473231341),h,f,n[r+7],22,-45705983),a=l(a,h=l(h,f=l(f,i,a,h,n[r+8],7,1770035416),i,a,n[r+9],12,-1958414417),f,i,n[r+10],17,-42063),h,f,n[r+11],22,-1990404162),a=l(a,h=l(h,f=l(f,i,a,h,n[r+12],7,1804603682),i,a,n[r+13],12,-40341101),f,i,n[r+14],17,-1502002290),h,f,n[r+15],22,1236535329),a=g(a,h=g(h,f=g(f,i,a,h,n[r+1],5,-165796510),i,a,n[r+6],9,-1069501632),f,i,n[r+11],14,643717713),h,f,n[r],20,-373897302),a=g(a,h=g(h,f=g(f,i,a,h,n[r+5],5,-701558691),i,a,n[r+10],9,38016083),f,i,n[r+15],14,-660478335),h,f,n[r+4],20,-405537848),a=g(a,h=g(h,f=g(f,i,a,h,n[r+9],5,568446438),i,a,n[r+14],9,-1019803690),f,i,n[r+3],14,-187363961),h,f,n[r+8],20,1163531501),a=g(a,h=g(h,f=g(f,i,a,h,n[r+13],5,-1444681467),i,a,n[r+2],9,-51403784),f,i,n[r+7],14,1735328473),h,f,n[r+12],20,-1926607734),a=v(a,h=v(h,f=v(f,i,a,h,n[r+5],4,-378558),i,a,n[r+8],11,-2022574463),f,i,n[r+11],16,1839030562),h,f,n[r+14],23,-35309556),a=v(a,h=v(h,f=v(f,i,a,h,n[r+1],4,-1530992060),i,a,n[r+4],11,1272893353),f,i,n[r+7],16,-155497632),h,f,n[r+10],23,-1094730640),a=v(a,h=v(h,f=v(f,i,a,h,n[r+13],4,681279174),i,a,n[r],11,-358537222),f,i,n[r+3],16,-722521979),h,f,n[r+6],23,76029189),a=v(a,h=v(h,f=v(f,i,a,h,n[r+9],4,-640364487),i,a,n[r+12],11,-421815835),f,i,n[r+15],16,530742520),h,f,n[r+2],23,-995338651),a=m(a,h=m(h,f=m(f,i,a,h,n[r],6,-198630844),i,a,n[r+7],10,1126891415),f,i,n[r+14],15,-1416354905),h,f,n[r+5],21,-57434055),a=m(a,h=m(h,f=m(f,i,a,h,n[r+12],6,1700485571),i,a,n[r+3],10,-1894986606),f,i,n[r+10],15,-1051523),h,f,n[r+1],21,-2054922799),a=m(a,h=m(h,f=m(f,i,a,h,n[r+8],6,1873313359),i,a,n[r+15],10,-30611744),f,i,n[r+6],15,-1560198380),h,f,n[r+13],21,1309151649),a=m(a,h=m(h,f=m(f,i,a,h,n[r+4],6,-145523070),i,a,n[r+11],10,-1120210379),f,i,n[r+2],15,718787259),h,f,n[r+9],21,-343485551),f=d(f,e),i=d(i,o),a=d(a,u),h=d(h,c);return[f,i,a,h]}function a(n){var t,r="",e=32*n.length;for(t=0;t<e;t+=8)r+=String.fromCharCode(n[t>>5]>>>t%32&255);return r}function h(n){var t,r=[];for(r[(n.length>>2)-1]=void 0,t=0;t<r.length;t+=1)r[t]=0;var e=8*n.length;for(t=0;t<e;t+=8)r[t>>5]|=(255&n.charCodeAt(t/8))<<t%32;return r}function e(n){var t,r,e="0123456789abcdef",o="";for(r=0;r<n.length;r+=1)t=n.charCodeAt(r),o+=e.charAt(t>>>4&15)+e.charAt(15&t);return o}function r(n){return unescape(encodeURIComponent(n))}function o(n){return function(n){return a(i(h(n),8*n.length))}(r(n))}function u(n,t){return function(n,t){var r,e,o=h(n),u=[],c=[];for(u[15]=c[15]=void 0,16<o.length&&(o=i(o,8*n.length)),r=0;r<16;r+=1)u[r]=909522486^o[r],c[r]=1549556828^o[r];return e=i(u.concat(h(t)),512+8*t.length),a(i(c.concat(e),640))}(r(n),r(t))}function t(n,t,r){return t?r?u(t,n):function(n,t){return e(u(n,t))}(t,n):r?o(n):function(n){return e(o(n))}(n)}"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:n.md5=t}(this);