function send_auth_code(uemail , _acallback){
    var curr_sec = new Date().getTime()/1000;
    if(typeof MZK_BGS.mzk_user_info.last_send_email !== "undefined" && MZK_BGS.mzk_user_info.last_send_email == uemail && (curr_sec - MZK_BGS.mzk_user_info.last_sendmail_time) < 300) {
        $.confirm({
            title: "没有收到验证码？",
            content: "请先检查垃圾箱! 垃圾箱也没有的话， 请再次确认邮件账号填写是否正确哦。",
            type:"orange",
            buttons: {
                OK: function () {
                    $("#login_mail_username").focus();
                }
            }
        }); 
        return;
    }
    MZK_getJSON_DATA("chromeext/email/sendcode",{email: uemail},
        function( data ) {
            if(data.result != 'ok') {
                console.log(data.msg);
            }else{
                if(typeof data.reg_status !== "undefined" && data.reg_status != "open" && !MZK_BGS.mzk_user_info.is_vip) {
                    close_register_note(data.close_msg);
                    return;
                }
                
                $("#get_email_code").text(MZK_BGS.get_lan_msg("email_auth_send_ok")).prop('disabled', true);
                $.confirm({
                    title: MZK_BGS.get_lan_msg("success_title"),
                    type: "green",
                    content: MZK_BGS.get_lan_msg("email_auth_send_ok_tips"),
                    buttons: {
                        OK: function () {
                            $("#login_authcode").focus();
                            localStorage.setItem("last_email_username",$("#login_mail_username").val());
                            localStorage.setItem("last_email_domain",$("#login_mail_ext").val());
                        }
                    }
                });
                chrome.browserAction.setPopup({popup:"login.html"});
                MZK_BGS.mzk_user_info.last_sendmail_time = new Date().getTime()/1000;
                MZK_BGS.mzk_user_info.last_send_email = uemail;
            }
            if(_acallback) _acallback();
        }
    );
}

function get_email_domain(_acallback){
    MZK_getJSON_DATA("chromeext/muser/email_domain",{},function(data){
        if(data.result != 'ok') {
                console.log(data.msg);
            }else{
                var s_str = '';
                var last_email_domain = localStorage.getItem("last_email_domain");
                $.each(data.email_domain,function(i,k){
                    if(last_email_domain && last_email_domain == k) s_str += '<option selected="true">'+k+'</option>';
                    else s_str += '<option>'+k+'</option>';
                });
                $("#login_mail_ext").append(s_str);
                $("#login_welcome_text").html(data.login_welcome_text);
                $("#login_mail_username").val(localStorage.getItem("last_email_username"));
            }
            if(_acallback) _acallback();
    });
}

function close_register_note(close_msg){
    $.confirm({
        title: "Error",
        content: close_msg,
        type:"red",
        buttons: {
            OK: function () {
                window.history.go(-1);
            }
        }
    }); 
}

function login_back_button(){
    $("#mzk_back").unbind("click");
    $("#mzk_back").click(function (){
        chrome.browserAction.setPopup({popup:"main.html"});
        window.location.href = "main.html";
    });
}

$(document).ready(function () {
    login_back_button();
    if(MZK_BGS.mzk_user_info.email) {
        $.confirm({
            content: MZK_BGS.get_lan_msg("user_has_been_login"),
            buttons: {
                OK: function () {
                    window.history.go(-1);
                }
            }
        }); 
        return;
    }
    if(!MZK_BGS.mzk_user_token) {
        MZK_BGS.auto_register(function(){get_email_domain();});
    }else{
        get_email_domain();
    }
    lang_init();
    $("#login_mail_username").prop("placeholder",MZK_BGS.get_lan_msg("input_email_username"));
    $("#login_authcode").prop("placeholder",MZK_BGS.get_lan_msg("input_email_auth_code"));
    $("#login_reg_code").prop("placeholder",MZK_BGS.get_lan_msg("input_Invite_Code"));
   $("#get_email_code").click(function (){
        var email_username = $("#login_mail_username").val();
        if(!email_username || !/^[a-z0-9\._-]{2,36}$/igm.test(email_username)) {
            $.confirm({
                title: "Error",
                type: "red",
                content: MZK_BGS.get_lan_msg("email_username_error"),
                buttons: {
                    OK: function () {
                        $("#login_mail_username").focus();
                    }
                }
            }); 
            return;
        }
        var email_domain_ext = $("#login_mail_ext").val();
        if(email_domain_ext === "@gmail.com") {
            email_username = email_username.replace(".","");
            $("#login_mail_username").val(email_username);
        }
        var email_address = email_username.toLowerCase() + email_domain_ext;

        if(/^([0-9]+)$/ig.test(email_username) && email_domain_ext === "@gmail.com" && isExistOption("login_mail_ext","@qq.com")){
            $.confirm({
                title: "注意",
                content: "亲，您输入的是纯数字账号,但选择的邮箱后缀是Gmail。请注意这是您的Gmail邮箱而不是QQ.com邮箱吗？",
                buttons: {
                    OK: {
                        text : "是Gmail",
                        action: function () {
                            continue_send_code(email_address);
                        },
                    },
                    NO : {
                        text : "是QQ.com",
                        action: function () {
                            $("#login_mail_ext").val("@qq.com");
                            $("#login_mail_username").focus();
                        },
                    },
                    OTHER : {
                        text : "都不是",
                        action: function () {
                            $("#login_mail_username").focus();
                        },
                    },
                }
            }); 
            return;
        }
        continue_send_code(email_address);
    });

    function continue_send_code(email_address){
        $("#login_authcode").val('');
        send_auth_code(email_address , function(){});
    }

    function isExistOption(id,value) {  
        var isExist = false;  
        var count = $('#'+id).find('option').length;  
    
          for(var i=0;i<count;i++)     
          {     
             if($('#'+id).get(0).options[i].value == value)     
                 {     
                       isExist = true;     
                            break;     
                      }     
            }     
            return isExist;  
    }
    
    $("#submit_login").click(function(){
        var email_username = $("#login_mail_username").val();
        if(!email_username || !/^[a-z0-9\._-]{2,36}$/igm.test(email_username)) {
            $.confirm({
                title: "Error",
                content: MZK_BGS.get_lan_msg("email_username_error"),
                buttons: {
                    OK: function () {
                        $("#login_mail_username").focus();
                    }
                }
            }); 
            return;
        }
        var email_domain_ext = $("#login_mail_ext").val();
        if(email_domain_ext === "@gmail.com") {
            email_username = email_username.replace(".","");
        }
        var email_address = email_username.toLowerCase() + email_domain_ext;
        
        var auth_code = $("#login_authcode").val();
        if(!auth_code) {
            $("#login_authcode").focus();
            return;
        }
        var login_reg_code = $("#login_reg_code").val();
        MZK_getJSON_DATA("chromeext/muser/email_login" , {email: email_address,authcode: auth_code,reg_code:login_reg_code},function(data){
            if(data.result == 'ok') {
                MZK_BGS.mzk_user_info = data.uinfo;
                chrome.storage.local.set({uinfo: JSON.stringify(data.uinfo)}, function () {
                    localStorage.setItem("last_email_username",email_username);
                    localStorage.setItem("last_email_domain",$("#login_mail_ext").val());
                    MZK_BGS.mzk_select_server_info = false;
                    MZK_BGS.mzk_is_connect = false;
                    chrome.browserAction.setPopup({popup:"main.html"});
                    MZK_BGS.mzk_user_info.last_sendmail_time =undefined;
                    MZK_BGS.mzk_user_info.last_send_email = undefined;
                    MZK_BGS.check_proxy_permissions();
                    window.location.href = "main.html";
                });
            }else{
                $.confirm({
                    content: MZK_BGS.get_lan_msg("email_auth_code_error"),
                    buttons: {
                        OK: function () {
                            $("#login_authcode").focus();
                        }
                    }
                });
                
            }
        });
    });
});