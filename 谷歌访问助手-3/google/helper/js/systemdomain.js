function systemdomain_init() {
    $.each(MZK_BGS.mzk_pac_config.system_proxydomain.data, function (i, k) {
        var s_str = '<tr><td>' + (i + 1) + '</td><td>' + k + '</td></tr>';
        $("#mzk_domain_tbody_list").append(s_str);
    });
}

$(document).ready(function () {
    check_user_login(systemdomain_init);
    $("#count_custom_bypassdomain").html(MZK_BGS.mzk_pac_config.user_custom_bypassdomain.data.length);
    $("#count_custom_proxydomain").html(MZK_BGS.mzk_pac_config.user_custom_proxydomain.data.length);
    $("#count_system_proxydomain").html(MZK_BGS.mzk_pac_config.system_proxydomain.data.length);
});