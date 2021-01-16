function white_init() {
    MZK_getJSON_DATA("chromeext/pac/get_bypassdomain_list", {}, function (data) {
        if (data.result == "ok") {
            $.each(data.list, function (i, k) {
                var s_str = '<tr id="mzk_tr_' + k.id + '"><td>' + (i + 1) + '</td><td>' + k.domain + '</td><td>' + k.remarks + '</td><td><button id="' + k.id + '" domain="' + k.domain + '" class="btn button-delete btn-outline-danger">Del</button></td></tr>';
                $("#mzk_domain_tbody_list").append(s_str);
            });

            $(".button-delete").click(function () {
                remove_doamin(this.id, $(this).attr("domain"));
            });
        } else {
            console.log(data.msg);
        }
    });
}

function remove_doamin(id, domain) {
    MZK_getJSON_DATA("chromeext/pac/remove_white_domain", { domain_id: id, domain_type: "user_bypassdomain" }, function (data) {
        if (data.result == 'ok') {
            $("#mzk_tr_" + id).remove();
            var index = MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.indexOf(domain);
            if (index !== -1) {
                MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.splice(index, 1);
            }
        } else {
            console.log(data.msg);
        }
    });
}

$(document).ready(function () {
    check_user_login(white_init);
    stop_loading();
    $("#count_custom_bypassdomain").html(MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.length);
    $("#count_custom_proxydomain").html(MZK_BGS.mzk_pac_config.user_custom_proxydomain.data.length);
    $("#count_system_proxydomain").html(MZK_BGS.mzk_pac_config.system_proxydomain.data.length);
    $("#add_new_domain_button").click(function () {
        var add_domain = $("#add_new_domain").val();
        if (!CheckIsValidDomain(add_domain)) {
            $.confirm({
                title: '域名格式错误!',
                content: '请填写正确的域名,如 www.google.com 只需要填写 google.com 即可。不需要http等其他参数. 我们目前不支持包含中文等特殊字符的域名。',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    close: function () {
                        $("#add_new_domain").focus();
                    }
                }
            });
            return false;
        }
        var add_marks = $("#add_new_remarks").val();
        if (mzk_containSpecial.test(add_marks)) {
            $.confirm({
                title: '备注格式错误!',
                content: '备注不能包含特殊字符，并且长度在20个字符以内。',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    close: function () {
                        $("#add_new_remarks").focus();
                    }
                }
            });
            return false;
        }

        if(MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.length >= 500) {
            $.confirm({
                title: '超出限制',
                content: '亲，您添加的域名太多了应影响浏览器性能哦！ 默认不需要添加这么多域名，系统会根据 GEOIP 自动判断分流哦。',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    close: function () {
                        $("#add_new_domain").focus();
                    }
                }
            });
            return;
           }

        var sys_direct_index = MZK_BGS.mzk_pac_config.direct_domain.data.indexOf(add_domain);
        if (sys_direct_index !== -1) {
            $.confirm({
                title: '域名已经存在',
                content: '此域名已经在系统默认的直连名单中，不需要再额外添加哦。',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    close: function () {
                        $("#add_new_domain").focus();
                    }
                }
            });
            return;
        }

        var sys_bypass_index = MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.indexOf(add_domain);
        if (sys_bypass_index !== -1) {
            $.confirm({
                title: '域名已经存在',
                content: '亲，您已经添加过此域名了。',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    close: function () {
                        $("#add_new_domain").focus();
                    }
                }
            });
            return;
        }

        MZK_getJSON_DATA("chromeext/pac/add_white_domain", { domain: add_domain, remarks: add_marks, domain_type: "user_bypassdomain" }, function (data) {
            if (data.result == "ok") {
                MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.push(add_domain);
                location.reload();
            } else {
                alert(data.msg);
            }
        });
    });
});