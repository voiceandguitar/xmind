check_user_login(function () {
    $("#exp_date").html(MZK_BGS.mzk_user_info.vip_expired);
});


function enable_connect_button() {
    $("#connect_button").addClass('active');
    $("#connect_button").attr('att', '0');
    $("#mzk_home_link_text").html(MZK_BGS.get_lan_msg("vpn_connected"));
}

function disable_connect_button() {
    $("#connect_button").removeClass('active');
    $("#connect_button").attr('att', '1');
    $("#mzk_home_link_text").html(MZK_BGS.get_lan_msg("vpn_click_connect"));
}

function change_connect_model(is_reconn) {
    if (MZK_BGS.mzk_is_connect && is_reconn) {
        MZK_BGS.open_vpn();
    }

    if (MZK_BGS.mzk_pac_config.geoip_switch === true) {
        $("#connect_mode_text").html(MZK_BGS.get_lan_msg("vpn_mode_geoip_enable"));
        if(is_reconn) $("#connect_mode_text").css({color:"#333"});
    } else {
        $("#connect_mode_text").html(MZK_BGS.get_lan_msg("vpn_mode_geoip_disable"));
        if(is_reconn) $("#connect_mode_text").css({color:"#e5e5e5"});
    }
}


function Resume_vpn_display_status() {
    // 连接模式
    if (MZK_BGS.mzk_connect_mode) {
        change_connect_model(0);
    }
    if (MZK_BGS.mzk_is_connect && MZK_BGS.mzk_server_id) {
        enable_connect_button();
    } else {
        disable_connect_button();
    }
}

var last_query_domain = '';
$(document).ready(function () {
    lang_init();
    if (MZK_BGS.mzk_select_server_info) {
        $("#server_name").html(MZK_BGS.mzk_select_server_info.name);
        Resume_vpn_display_status();
    } else {
        MZK_BGS.get_default_server(function () {
            $("#server_name").html(MZK_BGS.mzk_select_server_info.name);
            Resume_vpn_display_status();
            MZK_BGS.open_vpn();
            enable_connect_button();
            if(MZK_BGS.mzk_user_info.is_vip){
                MZK_BGS.KeepLive_Session();
            }
        });
    }
    $("#mzk_app_ver").html(MZK_BGS.mzk_config.app_ver);
    $('.switch .switch-col .switch-main').click(function () {
        if (!MZK_BGS.mzk_is_connect) {
            if(!MZK_BGS.mzk_server_id) {
                alert(MZK_BGS.get_lan_msg("vpn_must_select_server_tips"));
                return false;
            }
            MZK_BGS.open_vpn();
            enable_connect_button();
        } else {
            MZK_BGS.close_vpn(function () {
                disable_connect_button();
            });
        }
    });

    if(MZK_BGS.mzk_config.device_name === "firefox" && typeof browser !== "undefined" && !MZK_BGS.mzk_config.is_ff_privateBrowsingAllowed) {
        $("#firefox_per_tips").show();
        $("#firefox_per_tips_div").click(function (){
            chrome.tabs.create({
                url: chrome.runtime.getURL("helper/ff_tips.html"),
            });
        });
    }

    $("#connect_mode_div").click(function () {
        if (MZK_BGS.mzk_pac_config.geoip_switch == false) {
            MZK_BGS.mzk_pac_config.geoip_switch = true;
        } else {
            if (!MZK_BGS.mzk_user_info.is_vip || MZK_BGS.mzk_user_info.vip_level < 1) {
                only_vip_tips();
                return false;
            }
            MZK_BGS.mzk_pac_config.geoip_switch = false;
        }
        change_connect_model(1);
        chrome.storage.local.set({mzk_geoip_switch: MZK_BGS.mzk_pac_config.geoip_switch});
    });

    if (!MZK_BGS.mzk_user_info.is_vip) {
        $("#connect_mode_div").css({color:"#e5e5e5",cursor:"not-allowed"});
    }

    $('.language ul li').click(function () {
        $(this).addClass('active').siblings().removeClass('active');
    });
    $("#mzk_select_link").click(function () {
        window.location.href = "select_line.html";
    });

    $("#mzk_buyvip_buutton").click(function () {
        window.location.href = "buyvip.html";
    });

    $("#vip_date_tips").click(function () {
        window.location.href = "buyvip.html";
    });

    $("#mzk_setting_buutton").click(function () {
        window.location.href = "setting.html";
    });

    $("#main_notes").html(MZK_BGS.mzk_config.notice.title).click(function(){
        if(/^http/g.test(MZK_BGS.mzk_config.notice.url)){
            chrome.tabs.create({
                url: MZK_BGS.mzk_config.notice.url
            });
        }else{
            window.location.href=MZK_BGS.mzk_config.notice.url;
        }
    });

    chrome.tabs.query({active: true}, function (tab) {
        var url = '';
        if (tab[0].url)
            url = tab[0].url;
        else
            return;
        var url_info = new URL(url);
        if (url_info.protocol === "http:" || url_info.protocol === "https:") {
            $("#mzk_curr_domain").html(url_info.hostname);
            $("#add_curr_domain_button_div").show();
            last_query_domain = url_info.hostname;
            check_domain_isproxy(last_query_domain);
            localStorage.setItem("last_query_domain",last_query_domain);
        }
    });
    check_proxy_permissions();
});

function check_proxy_permissions(){
    if(MZK_BGS.mzk_config.device_name === "firefox" && typeof browser !== "undefined") {
        var app_count = 0;
        chrome.management.getAll(function(ExtensionInfo){
            ExtensionInfo.forEach(function(EInfo){
                if(typeof EInfo.permissions !== "undefined" && EInfo.permissions.indexOf('proxy') !== -1 && EInfo.enabled === true && EInfo.id !== chrome.runtime.id && app_count < 1) {
                    app_count++;
                      $.dialog({
                        title: MZK_BGS.get_lan_msg("fix_proxy_error_title"),
                        content: MZK_BGS.get_lan_msg('firefox_proxy_error_tips',[EInfo.name]),
                    });  
                }
            });
        });

        chrome.proxy.settings.get({
            'incognito': false
        },
        function (proxy_config) {
            if (proxy_config.levelOfControl === 'controlled_by_this_extension' && proxy_config.value.autoConfigUrl && !MZK_BGS.mzk_config.is_ff_privateBrowsingAllowed) {
                $.confirm({
                    title: MZK_BGS.get_lan_msg("fix_proxy_error_title"),
                    content: MZK_BGS.get_lan_msg("firefox_proxy_self_error_tips"),
                    type: 'red',
                    typeAnimated: true,
                    buttons: {
                        ok: {
                            text: MZK_BGS.get_lan_msg("fix_button"),
                            btnClass: 'btn-red',
                            action: function(){
                                chrome.tabs.create({
                                    url: chrome.runtime.getURL("helper/ff_tips.html"),
                                });
                                window.close();
                            }
                        },
                        close: function () {
                            window.close();
                        }
                    }
                });
            }else if((proxy_config.levelOfControl === 'controlled_by_this_extension' || proxy_config.levelOfControl === 'controllable_by_this_extension') && MZK_BGS.mzk_is_connect && !proxy_config.value.autoConfigUrl && MZK_BGS.mzk_config.is_ff_privateBrowsingAllowed){
                MZK_BGS.open_vpn();
            }
        });

    }else{
        chrome.proxy.settings.get({
            'incognito': false
        },
        function (proxy_config) {
            if (proxy_config['levelOfControl'] === 'controlled_by_other_extensions') {
                $.confirm({
                    title: MZK_BGS.get_lan_msg("fix_proxy_error_title"),
                    content: MZK_BGS.get_lan_msg("fix_proxy_per_tips"),
                    type: 'red',
                    typeAnimated: true,
                    buttons: {
                        ok: {
                            text: MZK_BGS.get_lan_msg("fix_button"),
                            btnClass: 'btn-red',
                            action: function(){
                                chrome.runtime.sendMessage({cmd:"check_proxy_permissions"});
                            }
                        },
                        close: function () {
                        }
                    }
                });
            }
        });
    }
}


function check_domain_isproxy(domain) {
    var is_proxy = false;
    if(MZK_BGS.mzk_user_info.is_vip) {
        if(testDomain(domain,MZK_BGS.mzk_pac_config.system_proxydomain.data)) is_proxy = true;
        if(testDomain(domain,MZK_BGS.mzk_pac_config.user_custom_proxydomain.data)) is_proxy = true;
    }else{
        if(testDomain(domain,MZK_BGS.mzk_pac_config.free_proxydomain.data)) is_proxy = true;
    }
    if(testDomain(domain,MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data)) is_proxy = false;
    if(is_proxy === true) {
        $("#add_curr_domain_button").html(MZK_BGS.get_lan_msg("domain_has_been_proxy")).removeClass("green_button").addClass("gray_button").prop('disabled', true);
    }
    else {
        enable_add_domain_button();
    }
}

function testDomain(target, domains, cnRootIncluded) {
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

function enable_add_domain_button(){
        $("#add_curr_domain_button").click(function(){
            if(MZK_BGS.mzk_user_info.is_vip) {
                add_new_whitedomain(localStorage.getItem("last_query_domain"),'',function(){
                    localStorage.setItem("last_query_domain_result", 2);
                    window.close();
                });
            }else{
                only_vip_tips();
            }
        });
}