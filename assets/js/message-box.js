document.onkeypress=function(event){
    if(event.keyCode==13){
        // $("#ok-info-message").click();
        // $("#message-box-confirm-btn").click();
    }
}

function message_box_info(message){
    $("#message-box-info-text").html(message);
    $('#message-box-info').modal('show');
}

function message_box_yesno(title,message,command=()=>{}){
    $("#message-box-yesno-title").html(title);
    $("#message-box-yesno-message").html(message);
    $('#message-box-yesno').modal('show');
    $("#message-box-confirm-btn").off('click');
    $("#message-box-confirm-btn").click(()=>{
        $('#message-box-yesno').modal('hide');
        command();
    })
}