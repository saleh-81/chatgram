var API_KEY = localStorage.getItem("API_KEY")
var user_data = {}
var login_dialog
var register_dialog
var popap_detial_settings

var chatSocket = null
var chatSocket_is_connected = false

function show_toast(message){
    toast = $(`
    <div class="toast align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>
    `)
    $("#toast-container").append(toast)
    toast.toast("show")

    toast.on("hidden.bs.toast",(e)=>{
        $(e.target).remove()
    })
}

function check_login(first_time=false,success_command=()=>{},error_command=()=>{}){
    if(API_KEY){
        $.ajax({
            method: "GET",
            url: "/api/accounts/profile/",
            data:{

            },
            headers: {
                "Authorization": `Token ${API_KEY}`,
            },
            success:(data)=>{
                user_data = data
                console.log(user_data)
                if(first_time){
                    show_toast(`welcome ${data.first_name} ${data.last_name}`)
                }
                success_command(data)
            },
            error:(xhr)=>{
                let response = xhr.responseJSON
                let detail = response.detail
                show_toast(detail)
                login_dialog.modal("show")
                console.log(response)
                error_command(response)
                
            }
        })
    }
    else{
        login_dialog.modal("show")
        error_command(null)
    }
}

function update_user_settings(data,success_command=()=>{},error_command=()=>{},file_type=false){
    if(API_KEY){
        let ajax_data ={
            method: "PATCH",
            url: "/api/accounts/profile/",
            data:data,
            headers: {
                "Authorization": `Token ${API_KEY}`,
            },
            success:(data)=>{
                user_data = data
                show_toast('your profile updated.')
                success_command(data)
            },
            error:(xhr)=>{
                let response = xhr.responseJSON
                console.log(response)
                error_command(response)
            }
        }        
        if (file_type){
            ajax_data.contentType=false
            ajax_data.processData=false
        }
        $.ajax(ajax_data)
    }
    else{
        login_dialog.modal("show")
    }
}

function open_detial_settings(section){
    let popap_detial_settings = $("#popap-detial-settings")
    popap_detial_settings.find("input[name=detial_setting]").val(section)
    let section_boxes = popap_detial_settings.find(".section")
    section_boxes.addClass('d-none')
    if(section)
        section_boxes.filter(`.${section}`).removeClass('d-none')
    popap_detial_settings.modal("show")
}



function srcToFile(src, fileName, mimeType){
    return (fetch(src)
        .then(function(res){return res.arrayBuffer();})
        .then(function(buf){return new File([buf], fileName, {type:mimeType});})
    );
}


function logout(all=false){
    if(API_KEY){      
        $.ajax(
            {
                method: "POST",
                url: `/api/accounts/logout${all?'all':''}/`,
                headers: {
                    "Authorization": `Token ${API_KEY}`,
                },
                success:(data)=>{
                    localStorage.removeItem("API_KEY")
                    location.reload();
                },
                error:(xhr)=>{
                    if(xhr.status==401){
                        login_dialog.modal("show")
                    }
                    else if(xhr.status==404){
                        show_toast("Invalid link!")
                    }
                    login_dialog.modal("show")
                }
            } 
        )
    }
    else{
        login_dialog.modal("show")
    }
}

var next_friends_link = null
function get_friends(first=false,success_command=()=>{},error_command=()=>{}){
    if(first){
        next_friends_link = "/api/accounts/friends/"
    }
    if(next_friends_link)
    $.ajax(
        {
            method: "GET",
            url: next_friends_link,
            headers: {
                "Authorization": `Token ${API_KEY}`,
            },
            success:(data)=>{
                next_friends_link = data.next
                success_command(data)
            },
            error:(xhr)=>{
                if(xhr.status==401){
                    login_dialog.modal("show")
                }
                error_command(xhr)
            }
        } 
    )
}


function remove_friend(id,name,element=null,box=null){
    message_box_yesno("Remove friend",`Are you sure about remove your friend "${name}"?`,()=>{
        $.ajax({
            method: "DELETE",
            url: `/api/accounts/friends/${id}`,
            headers: {
                "Authorization": `Token ${API_KEY}`,
            },
            success:()=>{
                message_box_info(`Your friend "${name}" removed.`)
                if(element){
                    if(box=='friends-list'){
                        $(element).parents(".item").remove()
                        if(!$("#popap-friends").find(".item").length)
                            $("#popap-friends").find('.no-firends').show()
                    }
                    else if(box=="profile"){
                        let buttons = $(element).parents(".buttons")
                        $(element).remove()
                        buttons.append(`
                            <button type="button" class="btn p-0 btn-info" onclick='add_friend(${id},"${name}",this,"profile")'>
                                <i class="fa-light fa-user-plus fa-lg"></i>
                            </button>
                        `)
                    }
                    else if(box=="chat-options"){
                        $(element).hide()
                        $(element).parents(".dropdown-menu").find(".add-friend").show()
                    }
                }

                    
            },
            error:(xhr)=>{
                if(xhr.status==401){
                    login_dialog.modal("show")
                }
                else if(xhr.status==404){
                    message_box_info("Firend not found!")
                }
            }
        })
    })
}

function add_friend(id,name,element=null,box=null){
        $.ajax({
            method: "POST",
            url: `/api/accounts/friends/${id}`,
            headers: {
                "Authorization": `Token ${API_KEY}`,
            },
            success:()=>{
                message_box_info(`User "${name}" Added to your friends.`)
                if(element){
                    if(box=="profile"){
                        let buttons = $(element).parents(".buttons")
                        $(element).remove()
                        buttons.append(`
                            <button type="button" class="btn p-0 btn-info" onclick='remove_friend(${id},"${name}",this,"profile")'>
                                <i class="fa-light fa-user-minus fa-lg"></i>
                            </button>
                        `)
                    }
                    else if(box=="chat-options"){
                        $(element).hide()
                        $(element).parents(".dropdown-menu").find(".remove-friend").show()
                    }
                }
                
                    
            },
            error:(xhr)=>{
                if(xhr.status==401){
                    login_dialog.modal("show")
                }
                else if(xhr.status==404){
                    message_box_info("User not found!")
                }
                else if(xhr.status==409){
                    message_box_info("User is already your friend.")
                }
            }
        })
}


function get_register_data(success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: "OPTIONS",
        url: "/api/accounts/register/",
        success:(data)=>{
            if(data.actions && data.actions.POST){
                success_command(data.actions.POST)
            }
        },
        error:(xhr)=>{
            show_toast(`Get register form error: ${xhr.status}`)
            error_command(xhr)
        }
    })
}

function register(data,success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: "POST",
        url: "/api/accounts/register/",
        data:data,
        success:(data)=>{
            success_command(data)
        },
        error:(xhr)=>{
            show_toast(`register error . status: ${xhr.status}`)
            error_command(xhr)
        }
    })
}

function get_user_data(id,success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: "GET",
        url: `/api/accounts/${id}`,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            success_command(data)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("User not found!")
            }
            error_command(xhr)
        }
    })
}

function show_profile(id){
    let popap_profile = $("#popap-profile")
    let image_box = popap_profile.find(".image")
    let name_field = image_box.find(".name")
    let info_box = popap_profile.find(".info")
    let user_buttons = image_box.find(".buttons")
    info_box.html("")
    user_buttons.html("")
    
    get_user_data(id,success_command=(user)=>{
        let image = user.profile_image ? user.profile_image : ""
        let full_name = `${user.first_name} ${user.last_name}`
        let username = user.username
        let biography = user.biography
        let phone_number = user.phone_number
        let email = user.email
        let is_friend = user.is_friend

        image_box.css("background-image",`url(${image})`)
        name_field.html(full_name)

        user_buttons.append(`
            <button type="button" class="btn p-0 btn-info" onclick='start_chat(${id})'>
                <i class="fa-light fa-message-lines fa-lg"></i>
            </button>
        `)
        if(is_friend){
            user_buttons.append(`
            <button type="button" class="btn p-0 btn-info" onclick='remove_friend(${id},"${full_name}",this,"profile")'>
            <i class="fa-light fa-user-minus fa-lg"></i>
            </button>
            `)
        }
        else{
            user_buttons.append(`
            <button type="button" class="btn p-0 btn-info" onclick='add_friend(${id},"${full_name}",this,"profile")'>
                <i class="fa-light fa-user-plus fa-lg"></i>
            </button>
            `)
        }

        info_box.append(`
            <div class="item username">
                <div class="key">
                    <i class="fa-light fa-at fa-lg"></i>
                    Username
                </div>
                <div class="value">
                    @${username}
                </div>
            </div>
        `)

        if(biography && biography.length){
            info_box.append(`
                <div class="item biography">
                    <div class="key">
                        <i class="fa-light fa-book-user fa-lg"></i>
                        Biography
                    </div>
                    <div class="value">${biography}</div>
                </div>
            `)
        }

        if(phone_number){
            info_box.append(`
                <div class="item phone_number">
                    <div class="key">
                        <i class="fa-light fa-phone fa-lg"></i>
                        Phone number
                    </div>
                    <div class="value">
                        <a href="tel:${phone_number}">${phone_number}</a>
                    </div>
                </div>
            `)
        }

        if(email){
            info_box.append(`
                <div class="item email">
                    <div class="key">
                        <i class="fa-light fa-envelope fa-lg"></i>
                        Email
                    </div>
                    <div class="value">
                        <a href="mailto:${email}">${email}</a>
                    </div>
                </div>
            `)
        }

        // $(".modal").modal("hide")
        popap_profile.modal("show")
    })
}


function start_chat(id){
    $(".modal").modal("hide")
    $(".menu").removeClass("open")
    let chat_box = $(".chat-box")
    let chat_box_elements = $(".chat-box > *")
    let chat_box_header = chat_box.find(".header")

    let chat_image = chat_box_header.find(".image")
    let chat_name = chat_box_header.find(".name")
    let chat_username = chat_box_header.find(".username")
    let chat_options = chat_box_header.find(".option")

    let show_profile_btn = chat_options.filter(".show-profile")
    let add_friend_btn = chat_options.filter(".add-friend")
    let remove_friend_btn = chat_options.filter(".remove-friend")
    let separator = chat_options.filter(".separator")
    let delete_chat_btn = chat_options.filter(".delete-chat")

    chat_options.hide()
    
    let chat_messages_box = chat_box.find(".messages")
    chat_messages_box.html("")

    let chat_input = chat_box_elements.find("#chat-input")
    chat_input.val("").trigger("input")

    let chat_image_input = chat_box_elements.find("input[type=file]#chat-image")
    chat_image_input.val(null).trigger("change")
    
    let user_id_input = chat_box_elements.find("input[name=user_id]")
    user_id_input.val("")


    if(chatSocket && chatSocket.readyState === WebSocket.OPEN){
        chatSocket.close()
    }

    chat_box_elements.hide()
    get_user_data(id,success_command=(user)=>{
        let id = user.id
        let image = user.profile_image ? user.profile_image : ""
        let full_name = `${user.first_name} ${user.last_name}`
        let username = user.username
        let image_letter = image ? "" : full_name.at(0).toUpperCase()
        let is_friend = user.is_friend

        user_id_input.val(id)

        chat_image.css("background-image",`url(${image})`)
        chat_image.html(image_letter)

        chat_name.html(full_name)
        chat_username.html(`@${username}`)

        $([chat_image[0],chat_name[0],chat_username[0]]).attr("onclick",`show_profile(${id})`)

        show_profile_btn.attr("onclick",`show_profile(${id})`)
        add_friend_btn.attr("onclick",`add_friend(${id},'${full_name}',this,'chat-options')`)
        remove_friend_btn.attr("onclick",`remove_friend(${id},'${full_name}',this,'chat-options')`)

        delete_chat_btn.attr("onclick",`delete_private_chat(${id})`)

        if(user.has_chat){
            separator.show()
            delete_chat_btn.show()
            get_private_messages(id,true,(data)=>{
                let messages = data.results
                set_private_messages(messages)
                chat_messages_box.animate({ scrollTop: chat_messages_box.prop("scrollHeight") }, 500);
            })
            connect_to_private_chat_socket(id)
            
        }

        show_profile_btn.show()
        is_friend ? remove_friend_btn.show() : add_friend_btn.show()

        chat_box_elements.show()
        chat_box.addClass("open")
    },error_command=()=>{
        set_private_chats()
    })
}




var next_private_chats_link = null
function get_private_chats(user_id=null,method="GET",first=true,success_command=()=>{},error_command=()=>{},){
    if(first){
        next_private_chats_link = `/api/chat/private_chat/${user_id ? user_id : ''}`
    }
    if(next_private_chats_link)
    $.ajax({
        method: method,
        url: next_private_chats_link,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            if(method=="GET"){
                next_private_chats_link = data.next
                success_command(data.results)
            }
            else{
                success_command(data)
            }
            
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Private chat not found!")
            }
            error_command(xhr)
        }
    })
}

function delete_private_chat(id){
    message_box_yesno("Delete chat","Are you sure about delete this chat?",()=>{
        get_private_chats(id,"DELETE",true,(data)=>{
            close_chat()
            set_private_chats()
            message_box_info("chat deleted.")
        },(xhr)=>{
    
        })
    })
    
}

var next_private_messages_link
function get_private_messages(user_id,first=true,success_command=()=>{},error_command=()=>{}){
    if(first){
        next_private_messages_link = `/api/chat/private_chat/${user_id}/messages/`
    }
    if(next_private_messages_link)
    $.ajax({
        method: "GET",
        url: next_private_messages_link,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            next_private_messages_link = data.next
            success_command(data)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Private chat not found!")
            }
            error_command(xhr)
        }
    })
}

function set_private_messages(messages,first=true){
    let chat_messages_box = $(".chat-box > .messages")
    for(message of messages){

        let text = message.message.replace(/\n/g,"<br/>").trim()
        let image = message.image
        let direction = message.direction
        let user = message.user == user_data.id ? "self" : "user"
        let datetime = message.datetime

        image_box = ""
        if(image){
            image_box = `
            <a href="${image}" target="blank">
                <div class="image">
                    <img src="${image}">
                </div>
            </a>
            `
        }

        let options = { year: 'numeric', month: 'long', day: 'numeric' , hour:'numeric' ,minute:'numeric',second:'numeric' };
        let today = new Date(datetime).toLocaleString('fa-IR',options);
        // let today = new Date(datetime).toLocaleString('en');

        let message_obj = $(`
            <div class="message ${user}">
                ${image_box}
                <div class="text" dir='${direction}'>${text}</div>
                <div class="footer">
                    <div class="time" dir='rtl'>
                        ${today}
                    </div>
                </div>
            </div>
        `)

        if(first){
            chat_messages_box.prepend(message_obj) 
        }
        else{
            chat_messages_box.append(message_obj) 
        }
        
    }
}

let can_add_private_chats = true
function set_private_chats(user_id=null,first=true){
    let private_chat_box = $(".menu-list > .list > .list-item[category=chats]")
    if (first)
        private_chat_box.html("")

    if(can_add_private_chats){
        can_add_private_chats=false

        get_private_chats(null,"GET",first,success_command=(private_chats)=>{
            for(private_chat of private_chats){
                can_add_private_chats=false
                let user = private_chat.user
                let id = user.id
                let image = user.profile_image ? user.profile_image : ""
                let image_letter = ""
                let full_name = `${user.first_name} ${user.last_name}`
                let username = user.username
                if(!image.length){
                    image_letter=full_name.at(0).toUpperCase()
                }

                let item = $(`
                    <div class="item ${id==user_id?'active':''}">
                        <div class="image" style='background-image:url(${image})'>${image_letter}</div>
                        <div class="content">
                            <div class="name">${full_name}</div>
                            <div class="id">@${username}</div>
                        </div>
                    </div>
                `)

                private_chat_box.append(item)

                item.click(()=>{
                    start_chat(id)
                    private_chat_box.find(".item").removeClass("active")
                    item.addClass("active")
                })
            }
            can_add_private_chats = true
        },error_command=(data)=>{
            can_add_private_chats = true
        })
    }
    
}



function close_chat(){
    let chat_box_elements = $(".chat-box > *")
    chat_box_elements.hide()
    $(".chat-box").removeClass("open")
    $(".menu-list > .list > .list-item > .item").removeClass("active")
    if(chatSocket && chatSocket.readyState === WebSocket.OPEN){
        chatSocket.close()
    }
}


function connect_to_private_chat_socket(user_id,data=null){
    chatSocket = new WebSocket(
        'ws://'
        + window.location.host
        + `/ws/chat/private_chat/${user_id}?token=${API_KEY}`,
    );

    chatSocket.onopen = function (e) {
        chatSocket_is_connected = true
        console.log('Chat socket successfully connected.');
        if(data){
            chatSocket.send(data)
            console.log("send message")
        }
        set_private_chats(user_id)

        $(".chat-box .header .option:where(.delete-chat,.separator)").show()
    };

    chatSocket.onclose = function (e) {
        chatSocket_is_connected = false
        console.log('Chat socket closed unexpectedly');
    };

    chatSocket.onmessage = function(e) {
        let data = JSON.parse(e.data);
        console.log(data)
        set_private_messages([data],false)
        let chat_box_messages = $(".chat-box .messages")
        chat_box_messages.animate({ scrollTop: chat_box_messages.prop("scrollHeight") }, 500);
    }
    
}

function send_private_message(user_id,message,dir,image){

    let data = {
        'text': message,
        'dir':dir,
        'sender':user_data.id,
        'image':image,
    }

    if(chatSocket && chatSocket.readyState === WebSocket.OPEN && chatSocket_is_connected){
        chatSocket.send(JSON.stringify(data));
        console.log("send message")
    }
    else{
        connect_to_private_chat_socket(user_id,JSON.stringify(data))
    }
}


var next_search_result_link
function search_user(query,first=false,success_command=()=>{},error_command=()=>{}){
    if(first){
        next_search_result_link = `/api/accounts/serach/?q=${query}`
    }
    if(next_search_result_link)
    $.ajax({
        method: "GET",
        url: next_search_result_link,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            next_search_result_link = data.next
            success_command(data.results)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Invalid link!")
            }
            error_command(xhr)
        }
    })
}


function set_search_results(first=true){
    let serach_value = $("input[name=serach-box]").val().trim()
    let result_box = $(".menu-list > .list > .header .result-box")  
    search_user(serach_value,first,(users)=>{
        if(users.length){
            for(user of users){
                let id = user.id
                let full_name = `${user.first_name} ${user.last_name}`
                let username = user.username
                let image = user.profile_image ? user.profile_image  : ""
                let image_letter = image ? "" : full_name.at(0).toUpperCase()

                result_box.append(`
                    <div class="result" onclick="show_profile(${id})">
                        <div class="image" style="background-image:url(${image})">${image_letter}</div>
                        <div class="content">
                            <div class="name">${full_name}</div>
                            <div class="username">@${username}</div>
                        </div>
                    </div>
                `)
            }
        }
        else{
            result_box.append("<div class='result'><p class='w-100 m-0 p-0 text-center'>no user found!</p></div>")
        }
    })
}


var next_groups_link = null
function get_groups(first=true,success_command=()=>{},error_command=()=>{}){
    if(first){
        next_groups_link = `/api/chat/group/`
    }
    if (next_groups_link)
    $.ajax({
        method: "GET",
        url: next_groups_link,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            next_groups_link = data.next
            success_command(data.results)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Group not found!")
            }
            error_command(xhr)
        }
    })
}

function get_group(id,method="GET",data={},success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: method,
        url: `/api/chat/group/${id}`,
        data: data,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            success_command(data)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Group not found!")
            }
            error_command(xhr)
        }
    })
}


function edit_group_detail(id,data,success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: "PATCH",
        url: `/api/chat/group/${id}/`,
        data: data,
        contentType:false,
        processData:false,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            success_command(data)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==403){
                show_toast("You do not have permission to edit this group!")
            }
            else if(xhr.status==404){
                show_toast("Group not found!")
            }
            error_command(xhr)
        }
    })
}


var next_group_users_link = null
function get_group_users(group_id,first=true,success_command=()=>{},error_command=()=>{}){
    if(first){
        next_group_users_link = `/api/chat/group/${group_id}/users/`
    }

    if(next_group_users_link)
    $.ajax({
        method: "GET",
        url: next_group_users_link,
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            next_group_users_link = data.next
            success_command(data.results)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Group users not found!")
            }
            error_command(xhr)
        }
    })
}

function add_group_user(group_id,user_id,success_command=()=>{},error_command=()=>{}){
    $.ajax({
        method: "POST",
        url: `/api/chat/group/${group_id}/users/`,
        data: {
            user_id : user_id
        },
        headers: {
            "Authorization": `Token ${API_KEY}`,
        },
        success:(data)=>{
            success_command(data)
        },
        error:(xhr)=>{
            if(xhr.status==401){
                login_dialog.modal("show")
            }
            else if(xhr.status==404){
                show_toast("Group users not found!")
            }
            error_command(xhr)
        }
    })
}


var can_add_groups = true
function set_groups(group_id=null,first=true){
    let groups_box = $(".menu-list > .list > .list-item[category=groups]")
    if(first)
        groups_box.html("")

    if(can_add_groups){
        can_add_groups = false
        get_groups(first,success_command=(groups)=>{
            for(group of groups){
                let id = group.id
                let title = group.title
                let image = group.image ? group.image : ""
                let image_letter = image ? "" : title.at(0).toUpperCase()
    
                let item = $(`
                    <div class="item ${id==group_id?'active':''}" group_id='${id}'>
                        <div class="image" style='background-image:url(${image})'>${image_letter}</div>
                        <div class="content">
                            <div class="name">${title}</div>
                        </div>
                    </div>
                `)
    
                groups_box.append(item)
    
                item.click(()=>{
                    start_group_chat(id)
                    groups_box.find(".item").removeClass("active")
                    item.addClass("active")
                })
            }
            can_add_groups = true
        },error_command=(data)=>{
            can_add_groups = true
        })
    }
    
}

function start_group_chat(id){

    close_chat()

    $(".modal").modal("hide")
    $(".menu").removeClass("open")

    let chat_box = $(".chat-box")
    let chat_box_elements = $(".chat-box > *")
    let chat_box_header = chat_box.find(".header")

    let chat_image = chat_box_header.find(".image")
    let chat_name = chat_box_header.find(".name")
    let chat_username = chat_box_header.find(".username")
    let chat_options = chat_box_header.find(".option")

    let group_info_btn = chat_options.filter(".group-info")
    let left_group_btn = chat_options.filter(".left-group")
    let separator = chat_options.filter(".separator")
    let delete_group_btn = chat_options.filter(".delete-group")

    chat_options.hide()
    
    chat_username.html("")
    
    let chat_messages_box = chat_box.find(".messages")
    chat_messages_box.html("")

    let chat_input = chat_box_elements.find("#chat-input")
    chat_input.val("").trigger("input")
    
    let user_id_input = chat_box_elements.find("input[name=user_id]")
    user_id_input.val("")


    get_group(id,"GET",null,success_command=(group)=>{
        let id = group.id
        let admin = group.admin
        let title = group.title
        let image = group.image ? group.image : ""
        let image_letter = image ? "" : title.at(0).toUpperCase()

        
        

        chat_image.css("background-image",`url(${image})`)
        chat_image.html(image_letter)

        chat_name.html(title)


        $([chat_image[0],chat_name[0],chat_username[0]]).attr("onclick",`show_group_info(${id})`)

        group_info_btn.attr("onclick",`show_group_info(${id})`)
        group_info_btn.show()


        left_group_btn.attr("onclick",`left_group(${id},"${title}")`)
        left_group_btn.show()


        separator.show()
        delete_group_btn.show()
        
        chat_box_elements.show()
    })
}



function show_group_info(group_id){
    // alert(`group info ${group_id}`)
    $(".modal").modal("hide")

    let popap_group_detial = $("#popap-group-detial")

    let popap_image = popap_group_detial.find(".image")
    let popap_name = popap_group_detial.find(".name")
    let users_box = popap_group_detial.find(".users > .value")
    let admin_id_input = users_box.find("input[name=admin_id]")

    let group_options = popap_image.find(".group-options")
    let group_options_edit = group_options.find(".edit-group-detial")
    let group_options_delete = group_options.find(".delete-group-detial")

    users_box.html("")

    group_options.hide()

    get_group(group_id,"GET",null,success_command=(group)=>{
        let title = group.title
        let image = group.image ? group.image : ""
        let admin = group.admin

        popap_image.css("background-image",`url(${image})`)
        popap_name.html(title)

        if(user_data.id==admin){
            group_options.show()
            group_options_edit.attr("onclick",`open_group_detail_settings(${group_id})`)
            group_options_delete.attr("onclick",`delete_group_confirm(${group_id})`)
        }

        get_user_data(admin,success_command=(user)=>{

            let admin_id = user.id
            let admin_name = `${user.first_name} ${user.last_name}`
            let admin_username = user.username
            let admin_image = user.profile_image ? user.profile_image : ""
            let admin_image_letter = admin_image ? "" : admin_name.at(0).toUpperCase()


            users_box.append(`
                <input type="hidden" name="admin_id" value="${admin_id}">
                <div class="item" onclick='show_profile(${admin_id})'>
                    <div class="image" style="background-image:url(${admin_image})">${admin_image_letter}</div>
                    <div class="content">
                        <div class="name">${admin_name}</div>
                        <div class="username">@${admin_username}</div>
                    </div>
                    <div class="post">admin</div>
                </div>
            `)

            get_group_users(group_id,true,success_command=(users)=>{
                for(user of users){
                    let user_id = user.id

                    if(user_id != admin_id){
                        let user_full_name = `${user.first_name} ${user.last_name}`
                        let user_username = user.username
                        let user_image = user.profile_image ? user.profile_image : ""
                        let user_image_letter = user_image ? "" : user_full_name.at(0).toUpperCase()

                        
                        users_box.append(`
                            <div class="item" onclick='show_profile(${user_id})'>
                                <div class="image" style="background-image:url(${user_image})">${user_image_letter}</div>
                                <div class="content">
                                    <div class="name">${user_full_name}</div>
                                    <div class="username">@${user_username}</div>
                                </div>
                            </div>
                        `)
                    }

                    
                }
            })

        })

        popap_group_detial.modal("show")
    })

    
}


function delete_group_confirm(group_id){
    get_group(group_id,"GET",null,success_command=(group)=>{
        let title = group.title
        message_box_yesno("Delete Group",`Are you sure that you want to delete group '${title}'`,()=>{
            get_group(group_id,method="DELETE",data={},success_command=()=>{
                $(".modal").modal("hide")
                set_groups(null,true)
                // close_chat()
                message_box_info(`group '${title}' deleted.`)
            },error_command=()=>{})
        })
    })
    
}


function open_group_detail_settings(group_id){
    get_group(group_id,"GET",null,success_command=(group)=>{
        let title = group.title
        let image = group.image ? group.image : ""
        // let admin = group.admin

        

        let popap_group_detial_settings = $("#popap-group-detial-settings")

        let group_id_input = popap_group_detial_settings.find("input[name=group_id]")

        let image_box = popap_group_detial_settings.find(".image-box > .default-image")
        let group_name_field = popap_group_detial_settings.find("#edit-group-name")

        group_id_input.val(group_id)

        image_box.css("background-image",`url(${image})`)
        group_name_field.val(title)


        popap_group_detial_settings.find(".image-buttons").addClass("d-none")
        image_box.removeClass("d-none")
        popap_group_detial_settings.find(".selected-image").addClass("d-none")

        popap_group_detial_settings.modal("show")
    },
    error_command=>{
        
    })
}

function left_group(group_id,group_name){
    message_box_yesno("Left group",`Are you sure about left group "${group_name}"?`,()=>{
        alert(`left group ${group_id}`)
    })
}


$(()=>{

    close_chat()

    let login_form = $("#login-form")
    login_dialog = $("#LoginDialog")
    let video_box = login_form.find(".video")[0]
    let video_canvas = $(`<canvas width="300" height="225"></canvas>`)[0]

    let stream = null;
    
    // try {
    //     stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    // }
    // catch(error) {
    //     alert(error.message);
    // }

    // video_box.srcObject = stream;
    




    register_dialog = $("#registerDialog")
    let register_form = register_dialog.find("#register-form")
    let menu = $(".menu")
    let menu_button = $(".menu-buttom")
    let menu_wrapper = $(".menu-wrapper")
    let categoty_items = $('.category .item:not(.menu-buttom)')
    let list_item = $(".list > .list-item")

    let main_name = $('.menu .profile-box .name')
    let main_username = $('.menu .profile-box .id')
    let main_profile_image = $('.menu .profile-box .image')

    let popap_settings = $("#popap-settings")
    let profile_input = popap_settings.find(".image-box input[name=profile_image]")
    let profile_input_shortcut = popap_settings.find(".image-box .profile-image-btn-shortcut")
    let profile_input_delete_shortcut = popap_settings.find(".image-box .profile-image-delete-shortcut")
    let profile_default_image = popap_settings.find(".image-box .default-image")
    let profile_image_btns = popap_settings.find(".image-box .image-buttons")
    let profile_selected_image = popap_settings.find(".image-box .selected-image")
    let selected_img_box = popap_settings.find(".image-box .selected-image")
    let profile_edit_ok_btn=profile_image_btns.find(".change-btn")
    let profile_edit_no_btn=profile_image_btns.find(".discard-btn")

    let settings_name = popap_settings.find(".info.name > .value")
    let settings_phone = popap_settings.find(".info.phone > .value")
    let settings_username = popap_settings.find(".info.username > .value")
    let settings_email = popap_settings.find(".info.email > .value")
    let settings_bio = popap_settings.find(".info.bio > .value")

    popap_detial_settings = $("#popap-detial-settings")
    let popap_detial_settings_save = popap_detial_settings.find(".save")
    let popap_detial_settings_section = popap_detial_settings.find("input[name=detial_setting]")

    let popap_password_change = $("#popap-password-change")

    let popap_firends = $("#popap-friends")
    let friends_list = popap_firends.find(".friends-list")

    let settings_show_email = popap_settings.find("input[type=checkbox]#show_email")
    let settings_show_phone = popap_settings.find("input[type=checkbox]#show_phone")
    let settings_show_image = popap_settings.find("input[type=checkbox]#show_image")
    let settings_show_biography = popap_settings.find("input[type=checkbox]#show_biography")

    let user_settings_btn = $(".user-settings-btn")


    // log out all account
    $("#logout_all_btn").click(()=>{
        message_box_yesno("Logout all","Are you sure that you wanna logout all your account?",()=>{
            logout(all=true)
        })
    })


    function set_profile_settings(){
        profile_input.val("")

        profile_default_image.css("background-image", user_data.profile_image?`url(${user_data.profile_image})`:'')

        settings_name.html(`${user_data.first_name} ${user_data.last_name}`)
        settings_phone.html(user_data.phone_number)
        settings_username.html("@"+user_data.username)
        settings_email.html(user_data.email)
        settings_bio.html(user_data.biography)


        settings_show_email.prop('checked',user_data.show_email)
        settings_show_phone.prop('checked',user_data.show_phone_number)
        settings_show_image.prop('checked',user_data.show_profile_image)
        settings_show_biography.prop('checked',user_data.show_biography)
    }

    function set_main_menu_profile(profile_image=null,name=null,username=null,id=null){
        
        if(name)
            main_name.html(`${name}`)

        if(username)
            main_username.html(`@${username}`)

        if(profile_image){
            main_profile_image.css('background-image',`url(${profile_image})`)
            main_profile_image.html('')
        }
        else{
            main_profile_image.html(name.at(0).toUpperCase())
            main_profile_image.css('background-image','')
        }

        if(id){
            main_profile_image.attr("onclick",`show_profile(${id})`)
            main_profile_image.parent('.profile-box').find('.content').attr("onclick",`show_profile(${id})`)
        }
        
    }


    // login codes //////////////////////////////////////

    login_form.find('button[data-bs-toggle="tab"]').on('shown.bs.tab', async function (e) {
        let tab_id = e.target.id

        if(tab_id == "faceId-tab"){
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
            catch(error) {
                alert(error.message);
            }

            video_box.srcObject = stream;
        }

        else{
            if(stream)
                stream.getTracks().forEach(track => track.stop());
            video_box.srcObject = null
        }

    })




    login_form.submit(function(e){
        e.preventDefault();

        let username = login_form.find("input[name=username]")
        let password = login_form.find("input[name=password]")


        username.removeClass("is-invalid")
        password.removeClass("is-invalid")
        login_form.find(".form-error").html("")

        let ajax_data = {
            method: "POST",
            url: "/api/accounts/login/",
            // data:null,
            // processData: false,
            // contentType: false,
            headers: {
                // "Authorization": "Token ",
            },
            success:(data)=>{
                token = data.token
                user_data = data.user

                localStorage.setItem("API_KEY",token)
                API_KEY = token
                set_main_menu_profile(data.user.profile_image,`${data.user.first_name} ${data.user.last_name}`,data.user.username,data.user.id)
                set_private_chats()
                show_toast(`you logged in successfully</br>welcome ${data.user.first_name} ${data.user.last_name}`)
                
                login_dialog.modal("hide")

                if(stream)
                    stream.getTracks().forEach(track => track.stop());
                video_box.srcObject = null

            },
            error:(xhr)=>{
                let response = xhr.responseJSON

                if(response.username){
                    username.parent().find(".invalid-feedback").html(response.username.join("</br>"))
                    username.addClass("is-invalid")
                }
                if(response.password){
                    password.parent().find(".invalid-feedback").html(response.password.join("</br>"))
                    password.addClass("is-invalid")
                }
                if(response.face_id){
                    login_form.find(".form-error").html(response.face_id.join("</br>"))
                }

                if(response.detail){
                    login_form.find(".form-error").html(response.detail)
                }


                if(response.non_field_errors){
                    login_form.find(".form-error").html(response.non_field_errors.join("</br>"))
                }


            }
        }

        let login_type = login_form.find("#LoginTypeTabContent .tab-pane.active").attr("login-type")

        if(login_type=="password"){
            ajax_data.data = {
                username : username.val(),
                password : password.val(),
                type : "password"
            }

            $.ajax(ajax_data)
        }
        else if(login_type=="face"){
            video_canvas.getContext('2d').drawImage(video_box, 0, 0, video_canvas.width, video_canvas.height);

            let image_data_url = video_canvas.toDataURL('image/jpeg');

            let data = new FormData()

            data.append('username',username.val())
            data.append('type',"face")


            fetch(image_data_url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'face.jpg', blob)
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file)

                data.append('face_image',dataTransfer.files[0])
                
                ajax_data.processData= false
                ajax_data.contentType= false
                ajax_data.data = data

                $.ajax(ajax_data)
            
            })

        }

        
        // let data = {
        //     username : username.val(),
        //     password : password.val(),
        // }
        

    });

    check_login(true,success_command=(data)=>{
        set_main_menu_profile(data.profile_image,`${data.first_name} ${data.last_name}`,data.username,data.id)
        set_private_chats()
    })


    register_dialog.on("show.bs.modal",(e)=>{
        register_form.find(".fields").html("")
        get_register_data(success_command=(required_fields)=>{
            for(let field_name in required_fields){
                        
                let type = 'text'
                if(field_name=='password'){
                    type = 'password'
                }
                else if(required_fields[field_name].type=='string'){
                    type = 'text'
                }
                else{
                    type = required_fields[field_name].type
                }


                register_form.find(".fields").append(`
                    <div class="mb-4">
                        <label for="${field_name}-register" class="form-label">${required_fields[field_name].label}</label>
                        <input type="${type}" class="form-control" id="${field_name}-register" name="${field_name}" maxlength="${required_fields[field_name].max_length}" ${required_fields[field_name].required ? "required=''" : ''}>
                        <div class="invalid-feedback"></div>
                    </div>
                `)
            }

            register_form.find(".fields").append(`
                <div class="mb-4">
                    <label for="confirm-password-register" class="form-label">Confirm password</label>
                    <input type="password" class="form-control" id="confirm-password-register" name="confirm-password" required="" autocomplete="false">
                    <div class="invalid-feedback">The two password fields didn’t match.</div>
                </div>
            `)
        },error_command=()=>{
            setTimeout(() => {
                register_dialog.modal('hide')
                login_dialog.modal('show')
            }, 500);
        })

    })

    register_form.submit((e)=>{
        e.preventDefault()
        register_form.find("input").removeClass('is-invalid')

        password_field = register_form.find("input[name=password]")
        confirm_password_field = register_form.find("input[name=confirm-password]")
        if(password_field.val()==confirm_password_field.val()){
            get_register_data((fields)=>{
                let data = {}
                for(field_name in fields){
                    try{
                        data[field_name] = register_form.find(`input[name=${field_name}]`).val()
                    }
                    catch{}
                }
                register(data,
                    success_command=(data)=>{
                        show_toast("You registered successfully.")
                        register_dialog.modal('hide')
                        login_dialog.modal('show')
                        
                },
                    error_command=(xhr)=>{
                        if(xhr.status==400){
                            let error_fields = xhr.responseJSON
                            for(let error_field in error_fields){
                                if(error_field=='non_field_errors'){
                                    register_form.find(".form-error").html(error_fields.non_field_errors.join("</br>"))
                                }
                                else{
                                    try{
                                        let field = register_form.find(`input[name=${error_field}]`)
                                        field.parent().find(".invalid-feedback").html(error_fields[error_field].join("</br>"))
                                        field.addClass("is-invalid")
                                    }
                                    catch(error){
                                        console.log(error)
                                    }
                                }
                            }
                        }
                })
            })
        }
        else{
            confirm_password_field.addClass("is-invalid")
        }
    })



    menu_button.click(()=>{
        menu.addClass("open")
    })

    menu_wrapper.click(()=>{
        menu.removeClass("open")
    })

    // categoty codes...
    categoty_items.each((i,e)=>{
        $(e).click(()=>{
            let category = $(e).attr("category")
            switch (category) {
                case "chats":
                    set_private_chats(null,true)
                    break;

                case "groups":
                    set_groups(null,true)
                    break;
            
                default:
                    break;
            }

            categoty_items.removeClass("active")
            list_item.hide()
            list_item.filter(`[category=${category}]`).fadeIn()
            $(e).addClass("active")
        })
    })

    let groups_box = list_item.filter("[category=groups]")
    let private_chats_box = list_item.filter("[category=chats]")

    groups_box.scroll(function() {
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
            if(next_groups_link){
                set_groups(null,false)
            }
        }
    })

    private_chats_box.scroll(function() {
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
            if (next_private_chats_link){
                set_private_chats(null,false)
            }
        }
    })


    // end category code //////////////////////////////


    profile_input_shortcut.click(()=>{
        profile_input.click()
    })



    let cropper=null
    profile_input.change(()=>{
        profile_image_btns.removeClass("d-none")
        profile_default_image.addClass("d-none")
        profile_selected_image.removeClass("d-none")

        if(profile_input[0].files && profile_input[0].files[0]){
            reader = new FileReader()
            
            reader.onload=(e)=>{
                selected_img_box.find("img").attr("src",e.target.result)

                cropper = new Cropper(selected_img_box.find("img")[0], {
                    aspectRatio: 1 / 1,
                    viewMode:2,
                    dragMode:'move',
                    });

            }
            reader.readAsDataURL(profile_input[0].files[0])
        }

        profile_input.val("")
    })


    profile_edit_ok_btn.click(()=>{
        if(cropper){
            image_data = cropper.getCroppedCanvas().toDataURL("image/png")
    
            srcToFile(image_data,"image.png","image/png")
            .then((file)=>{
                dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                profile_input[0].files = dataTransfer.files

                let data = new FormData()
                data.append('profile_image',profile_input[0].files[0])

                update_user_settings(data,
                    success_command=(data)=>{
                        profile_image_btns.addClass("d-none")
                        selected_img_box.find("img").attr("src","")
                        selected_img_box.addClass("d-none")

                        set_main_menu_profile(data.profile_image)
                        profile_default_image.css("background-image",`url('${data.profile_image}')`)
                        profile_default_image.removeClass("d-none")

                        cropper.destroy()
                        cropper=null


                    },error_command=null,file_type=true
                )
                
            })
            .catch(console.error)
        }
    })

    profile_edit_no_btn.click(()=>{
        profile_image_btns.addClass("d-none")
        profile_default_image.removeClass("d-none")
        profile_input.val("")
        selected_img_box.find("img").attr("src","")
        selected_img_box.addClass("d-none")
        if(cropper){
            cropper.destroy()
        }   
        cropper=null
    })


    profile_input_delete_shortcut.click(()=>{
        message_box_yesno('Delete profile image','are you sure about remove your profile image?',()=>{
            update_user_settings({
                profile_image:''
                },success_command=(data)=>{
                    set_main_menu_profile(data.profile_image,`${data.first_name} ${data.last_name}`,data.username)
                    profile_default_image.css("background-image",'')
                }
            )
        })
        
    })


    
    user_settings_btn.click(()=>{
        menu.removeClass("open")
        login_status = check_login(false,
            success=()=>{
                set_profile_settings()
                popap_settings.modal("show")
            },
            error_command=()=>{
                show_toast("error in get profile data")
            }
        )
        
    })

    // change detail settings //////////////////////////////////////////////////
    popap_detial_settings.on('show.bs.modal',()=>{
        // remove errors
        popap_detial_settings.find(".form-error").html("")
        popap_detial_settings.find('.section input').removeClass("is-invalid")

        // set default input values
        for(i in user_data){
            popap_detial_settings.find(`.section input.${i}`).val(user_data[i])
        }
    })

    popap_detial_settings_save.click(()=>{

        popap_detial_settings.find(".form-error").html("")
        popap_detial_settings.find('.section input').removeClass("is-invalid")

        let section = popap_detial_settings_section.val()
        let data={}
        
        if(section=='name'){
            data['first_name']=popap_detial_settings.find('.section input.first_name').val()
            data['last_name']=popap_detial_settings.find('.section input.last_name').val()
        }
        else{
            try{
                data[section]=popap_detial_settings.find(`.section input.${section}`).val()
            }
            catch(expection){
                console.log(expection)
            }
        }

        update_user_settings(data,
            success_command=(data)=>{
                set_profile_settings()
                set_main_menu_profile(data.profile_image,`${data.first_name} ${data.last_name}`,data.username)
                popap_detial_settings.modal("hide")
            },error_command=(data)=>{
                for(error_field in data){
                    if(error_field=='non_field_errors'){
                        popap_detial_settings.find(".form-error").html(data.non_field_errors.join("</br>"))
                    }
                    else{
                        try{
                            let field = popap_detial_settings.find(`.section input.${error_field}`)
                            field.addClass("is-invalid")
                            field.parent().find(".invalid-feedback").html(data[error_field].join("</br>"))
                        }
                        catch(error){
                            console.log(error)
                        }
                    }
                }
            }
        )
    })
    // end change detial settings ///////////////////////////////////////////////



    // change password /////////////////////////////////////
    popap_password_change.on('show.bs.modal',()=>{
        popap_password_change.find('input').val('')
        popap_password_change.find('input').removeClass("is-invalid")
    })

    popap_password_change.find("button.change").click(()=>{
        popap_password_change.find('input').removeClass("is-invalid")
        let old_password_field = popap_password_change.find(".old_password")
        let new_password_field = popap_password_change.find(".new_password")
        let confirm_new_password_field = popap_password_change.find(".confirm_new_password")

        let old_password = old_password_field.val()
        let new_password = new_password_field.val()
        let confirm_new_password = confirm_new_password_field.val()

        if(new_password==confirm_new_password){
            if(API_KEY){      
                $.ajax(
                    {
                        method: "PUT",
                        url: '/api/accounts/change_password/',
                        data:{
                            old_password:old_password,
                            new_password:new_password
                        },
                        headers: {
                            "Authorization": `Token ${API_KEY}`,
                        },
                        success:(data)=>{
                            let token = data.token
                            localStorage.setItem("API_KEY",token)
                            API_KEY = token
                            popap_password_change.modal('hide')
                            show_toast("your password changed successfully.")
                        },
                        error:(xhr)=>{
                            if(xhr.status==401){
                                popap_password_change.modal('hide')
                                login_dialog.modal("show")
                            }
                            else{
                                let response = xhr.responseJSON
                                for(error_field in response){
                                    if(error_field=='non_field_errors'){
                                        popap_password_change.find(".form-error").html(response.non_field_errors.join("</br>"))
                                    }
                                    else{
                                        try{
                                            let field = popap_password_change.find(`input.${error_field}`)
                                            field.addClass("is-invalid")
                                            field.parent().find(".invalid-feedback").html(response[error_field].join("</br>"))
                                        }
                                        catch(error){
                                            console.log(error)
                                        }
                                    }
                                }
                            }
                        }
                    } 
                )
            }
            else{
                login_dialog.modal("show")
            }
            
        }
        else{
            confirm_new_password_field.addClass("is-invalid")
        }
    })


    // end change password ////////////////////////////////


    settings_show_email.change(()=>{
        update_user_settings({
            show_email:settings_show_email.prop("checked")
            },success_command=(data)=>{
                settings_show_email.prop("checked",data.show_email)
            }
        )
    })

    settings_show_phone.change(()=>{
        update_user_settings({
            show_phone_number:settings_show_phone.prop("checked")
            },success_command=(data)=>{
                settings_show_phone.prop("checked",data.show_phone_number)
            }
        )
    })

    settings_show_image.change(()=>{
        update_user_settings({
            show_profile_image:settings_show_image.prop("checked")
            },success_command=(data)=>{
                settings_show_image.prop("checked",data.show_profile_image)
            }
        )
    })

    settings_show_biography.change(()=>{
        update_user_settings({
            show_biography:settings_show_biography.prop("checked")
            },success_command=(data)=>{
                settings_show_biography.prop("checked",data.show_biography)
            }
        )
    })


    // popap friends cods


    function set_friends_list(first=false){
        if(next_friends_link || first)
            popap_firends.find(".api_loading").css("display",'flex')
        if(first)
            popap_firends.find(".no-firends").show()

        get_friends(first,success_command=(data)=>{
            popap_firends.find(".api_loading").hide()
            let friends = data.results
            if(friends.length){
                popap_firends.find(".no-firends").hide()
            }
            for(friend of friends){
                let image_letter = friend.profile_image ? "" : friend.first_name.at(0).toUpperCase()
                let profile_image = friend.profile_image ? friend.profile_image : ""
                let full_name = `${friend.first_name} ${friend.last_name}`
                friends_list.append(`
                    <div class="item">
                        <div class="image" onclick="show_profile(${friend.id})" style="background-image:url(${profile_image})">${image_letter}</div>
                        <div class="content" onclick="show_profile(${friend.id})">
                            <div class="name">${full_name}</div>
                            <div class="username">@${friend.username}</div>
                        </div>
                        <div class="buttons">
                            <button type="button" class="btn btn-outline-danger" onclick="remove_friend(${friend.id},'${full_name}',this,'friends-list')">
                                <i class="fa-regular fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `)
            }

        })
    }

    popap_firends.find('.modal-body').on('scroll', function() {
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
            if(next_friends_link)
                set_friends_list()
        }
    })

    popap_firends.on('show.bs.modal',()=>{

        friends_list.html("")
        set_friends_list(true)

    })

    // end popap friends cods



    // chat box code ////////////////////////////////////////////
    let chat_input = $("#chat-input")
    let chat_image_input = $(".chat-box > .input > .buttons > input[type=file]#chat-image")
    chat_input.on("input",()=>{
        chat_input.parent().css("height",0)
        chat_input.parent().css("height",chat_input.prop('scrollHeight'))
    })

    chat_input.keyup(function(e) {
        let message=$(this).val().trim()
        if(message!=""){
            if(message.charAt(0).charCodeAt(0) < 200){
                $(this).css('direction','ltr')
            }
            else{
                $(this).css('direction','rtl')
            }
        }
    });

    function perform_send(){
        
        let message=chat_input.val().trim()
        let user_id = chat_input.parent().find("input[name=user_id]").val()
        let dir = chat_input.css('direction')
        let image_files = chat_image_input[0].files
        if(user_id && (message || image_files.length)){

            if(image_files.length){
                let file = image_files[0]
                let reader = new FileReader();
                reader.onload = function(event) {
                    const base64Image = event.target.result; 
                    send_private_message(user_id,message,dir,base64Image)
                };
                reader.readAsDataURL(file);
            }
            else{
                send_private_message(user_id,message,dir,null)
            }
            chat_input.val("").trigger("input")
            chat_image_input.val(null).trigger("change")
        }
    }

    chat_input.keydown(function (e) {
        if (e.ctrlKey && e.keyCode == 13) {
            perform_send()
        }
    });

    $(".send-btn").click(()=>{
        perform_send()
    })

    let chat_image_btn = $(".chat-box > .input > .buttons > .image-btn")
    let chat_image_count = chat_image_btn.find(".image-count")
    chat_image_input.change((event)=>{
        files = event.target.files
        if (files.length){
            chat_image_count.html(files.length)
            chat_image_count.removeClass("d-none")
        }
        else{
            chat_image_count.addClass("d-none")
        }
    })

    // $(document).keydown(function (e){
    //     // alert("hello")
    // });

    let chat_box_messages = $(".chat-box .messages")
    chat_box_messages.on('scroll', function() {
        if($(this).scrollTop() == 0) {
            let first_message = $(".chat-box .messages > .message").first()
            if(first_message.length){
                if(next_private_messages_link){
                    get_private_messages(null,false,(data)=>{
                        let messages = data.results
                        set_private_messages(messages)
                        chat_box_messages.animate({ scrollTop: first_message.offset().top-100 },0);
                    })
                }
            }
            
        }
    })

    // end chat box code ////////////////////////////////////////////




    // self messages btn
    $(".self-messages-btn").click(()=>{
        start_chat(user_data.id)
    })
    // end self message btn




    // search users codes ////////////////////////////

    let serach_box = $("input[name=serach-box]")
    let result_box = $(".menu-list > .list > .header .result-box")   
    let result_box_wrapper = $(".menu-list > .list > .header .result-box-wrapper")   

    serach_box.keypress(function (e) {
        if(e.which == 13)
        {
            result_box.html("")
            let serach_value = serach_box.val().trim()

            if(serach_value){
                set_search_results(true)
                result_box.fadeIn()
                result_box_wrapper.show()
            }
            else{
                result_box.fadeOut()
                result_box_wrapper.hide()
            }
            
        }
    })

    // serach_box.on("contextmenu",(e)=>{
    //     e.preventDefault()
    //     alert(e.clientX+e.clientY)
    // })

    result_box_wrapper.click(()=>{
        result_box.fadeOut()
        result_box_wrapper.hide()
    })

    result_box.scroll(function(){
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
            if(next_search_result_link){
                set_search_results(false)
            }
        }
    })



    // popap group detial codes

    let popap_group_detial_body = $("#popap-group-detial .modal-body")
    let group_users_box = popap_group_detial_body.find(".users > .value")
    
    popap_group_detial_body.scroll(function(){
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
            if(next_group_users_link){

                let admin_id = group_users_box.find("input[name=admin_id]").val()

                get_group_users(null,false,success_command=(users)=>{

                    for(user of users){

                        let user_id = user.id

                        if(user_id != admin_id){
                            let user_full_name = `${user.first_name} ${user.last_name}`
                            let user_username = user.username
                            let user_image = user.profile_image ? user.profile_image : ""
                            let user_image_letter = user_image ? "" : user_full_name.at(0).toUpperCase()


                            group_users_box.append(`
                                <div class="item" onclick='show_profile(${user_id})'>
                                    <div class="image" style="background-image:url(${user_image})">${user_image_letter}</div>
                                    <div class="content">
                                        <div class="name">${user_full_name}</div>
                                        <div class="username">@${user_username}</div>
                                    </div>
                                </div>
                            `)

                        }

                    }
                    
                })
            }
        }
    })


    // end popap group detial codes





    // edit popap group detail codes

    let popap_group_detial_settings = $("#popap-group-detial-settings")

    let group_id_input = popap_group_detial_settings.find("input[name=group_id]")

    let image_box = $("#popap-group-detial-settings .image-box")

    let group_detail_image_edit_btn = image_box.find(".group-image-edit-shortcut")
    let group_detail_image_delete_btn = image_box.find(".group-image-delete-shortcut")

    let group_detail_image_input = image_box.find("input[type='file'][name='image-input']")

    let group_default_image = image_box.find(".default-image")
    let group_selected_image = image_box.find(".selected-image")

    let group_image_btns = image_box.find(".image-buttons")
    let group_image_change_btn = group_image_btns.find(".change-btn")
    let group_image_discard_btn = group_image_btns.find(".discard-btn")

    let group_detail_data = new FormData()

    let group_title_input = popap_group_detial_settings.find("input#edit-group-name")

    let group_detail_save_btn = popap_group_detial_settings.find("button.save")
    


    group_detail_image_edit_btn.click(()=>{
        group_detail_image_input.click()
    })

    let group_cropper=null
    group_detail_image_input.change(()=>{
        group_image_btns.removeClass("d-none")
        group_default_image.addClass("d-none")
        group_selected_image.removeClass("d-none")

        if(group_detail_image_input[0].files && group_detail_image_input[0].files[0]){
            reader = new FileReader()
            
            reader.onload=(e)=>{
                group_selected_image.find("img").attr("src",e.target.result)

                group_cropper = new Cropper(group_selected_image.find("img")[0], {
                    aspectRatio: 1 / 1,
                    viewMode:2,
                    dragMode:'move',
                    });

            }
            reader.readAsDataURL(group_detail_image_input[0].files[0])
        }

        group_detail_image_input.val("")
    })


    group_image_discard_btn.click(()=>{
        group_image_btns.addClass("d-none")
        group_default_image.removeClass("d-none")
        group_detail_image_input.val("")
        group_selected_image.find("img").attr("src","")
        group_selected_image.addClass("d-none")
        if(group_cropper){
            group_cropper.destroy()
        }   
        group_cropper=null
    })


    group_image_change_btn.click(()=>{
        if(group_cropper){
            let image_data = group_cropper.getCroppedCanvas().toDataURL("image/png")
    
            srcToFile(image_data,"image.png","image/png")
            .then((file)=>{
                let dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                group_detail_image_input[0].files = dataTransfer.files

                group_detail_data.delete("image")
                group_detail_data.append('image',group_detail_image_input[0].files[0])

                group_image_btns.addClass("d-none")

                group_selected_image.find("img").attr("src","")
                group_selected_image.addClass("d-none")


                let fileReader = new FileReader();
                fileReader.readAsDataURL(group_detail_image_input[0].files[0]);
                fileReader.onload = function (e){
                    group_default_image.css("background-image",`url('${e.target.result}')`)
                }
                group_default_image.removeClass("d-none")

                group_cropper.destroy()
                group_cropper=null
                
            })
            .catch(console.error)
        }
    })

    group_detail_image_delete_btn.click(()=>{
        message_box_yesno("Delete group image","Are you sure about it?",()=>{
            group_default_image.css("background-image",``)
            group_detail_data.delete("image")
            group_detail_data.append("image","")
        })
    })

    group_detail_save_btn.click(()=>{
        group_detail_data.delete("title")
        group_detail_data.append("title",group_title_input.val())

        edit_group_detail(group_id_input.val(),group_detail_data,success=(data)=>{
            show_toast("Group detail updated.")
            $("#popap-group-detial-settings").modal("hide")
            
            
            let group_id = data.id
            let title = data.title
            let image = data.image ? data.image : ""

            change_all_group_displays(group_id,image,title)
        
        })
    })


    popap_group_detial_settings.on("hide.bs.modal",()=>{
        if(group_cropper){
            group_cropper.destroy()
        }   
        group_cropper=null
    })


    function change_all_group_displays(id,image,title){

        $("#popap-group-detial .modal-body > .image").css("background-image",`url(${image})`)
        $("#popap-group-detial .modal-body > .image .name").html(title)

        let image_letter=""
        if(!image){
            image_letter=title.at(0).toUpperCase()
        }

        $(".chat-box > .header > .image").css("background-image",`url(${image})`)
        $(".chat-box > .header > .image").html(image_letter)
        $(".chat-box > .header > .content > .name").html(title)

        $(`.menu-list > .list > .list-item[category="groups"] > .item[group_id="${id}"] > .image`).css("background-image",`url(${image})`)
        $(`.menu-list > .list > .list-item[category="groups"] > .item[group_id="${id}"] > .image`).html(image_letter)
        $(`.menu-list > .list > .list-item[category="groups"] > .item[group_id="${id}"] > .content > .name`).html(title)
    }


    let popap_faceId_settings = $("#popap-faceid-set")
    let faceId_box = popap_faceId_settings.find(".faceId-box")
    let defualt_face_box = faceId_box.find(".defualt-face-box")
    let capture_box = faceId_box.find(".capture-box")
    let video_capture = faceId_box.find("video.video")

    let defualt_capture_btns = faceId_box.find(".buttons.defualt")
    let capture_btns = faceId_box.find(".buttons.capture")

    let capture_face_btn = defualt_capture_btns.find("a.capture-face")
    let reset_face_btn = defualt_capture_btns.find("a.reset-face")
    let delete_face_btn = defualt_capture_btns.find("a.delete-face")

    let capture_cancel_btn = capture_btns.find("a.cancel-capture")
    let capture_confirm_btn = capture_btns.find("a.confirm-capture")

    let set_faceId_btn = popap_faceId_settings.find("button.change")

    let defualt_face = null
    let face_data_url = null
    let new_face = false

    capture_face_btn.click(async()=>{
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video_capture[0].srcObject = stream;
            defualt_face_box.addClass("d-none")
            capture_box.addClass("d-none")
            defualt_capture_btns.addClass("d-none")

            video_capture.removeClass("d-none")
            capture_btns.removeClass("d-none")
        }
        catch(error) {
            alert(error.message);
        }
    })

    capture_cancel_btn.click(()=>{
        if(stream)
            stream.getTracks().forEach(track => track.stop());
        video_capture.srcObject = null
        video_capture.addClass("d-none")
        capture_btns.addClass("d-none")
        defualt_capture_btns.removeClass("d-none")

        if(new_face){
            capture_box.removeClass("d-none")
            defualt_face_box.addClass("d-none")
        }
        else{
            capture_box.addClass("d-none")
            defualt_face_box.removeClass("d-none")
        }
        
        
    })

    capture_confirm_btn.click(()=>{
        video_canvas.getContext('2d').drawImage(video_capture[0], 0, 0, video_canvas.width, video_canvas.height);
        face_data_url = video_canvas.toDataURL('image/jpeg');
        new_face = true
        capture_box.css("background-image",`url("${face_data_url}")`)

        if(stream)
            stream.getTracks().forEach(track => track.stop());
        video_capture.srcObject = null

        video_capture.addClass("d-none")
        capture_btns.addClass("d-none")
        defualt_face_box.addClass("d-none")

        capture_box.removeClass("d-none")
        defualt_capture_btns.removeClass("d-none")
        // fetch(image_data_url)
        // .then(res => res.blob())
        // .then(blob => {
        //     const file = new File([blob], 'face.jpg', blob)
        // })
    })

    reset_face_btn.click(()=>{
        video_capture.addClass("d-none")
        capture_btns.addClass("d-none")
        capture_box.addClass("d-none")

        defualt_face_box.removeClass("d-none")
        defualt_capture_btns.removeClass("d-none")

        face_data_url = null
        new_face = false
    })

    delete_face_btn.click(()=>{
        face_data_url = null
        new_face = true

        capture_box.css("background-image",`none`)

        video_capture.addClass("d-none")
        capture_btns.addClass("d-none")
        defualt_face_box.addClass("d-none")

        capture_box.removeClass("d-none")
        defualt_capture_btns.removeClass("d-none")
    })


    set_faceId_btn.click(()=>{
        if(new_face && defualt_face != face_data_url){
            if(face_data_url){
                fetch(face_data_url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'face.jpg', blob)
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file)

                    let data = new FormData()
                    data.append("face_image",dataTransfer.files[0])

                    update_user_settings(data,success_command=()=>{
                        popap_faceId_settings.find(".form-error").html("")
                        message_box_info("A new Face ID has been set.")
                        popap_faceId_settings.modal("hide")
                    },
                    error_command=(data)=>{
                        if(data.face_image)
                            popap_faceId_settings.find(".form-error").html(data.face_image)
                    },file_type=true)
                })
            }
            else{
                update_user_settings({face_image:null},success_command=(data)=>{
                    popap_faceId_settings.find(".form-error").html("")
                    message_box_info("Face ID has been removed.")
                    popap_faceId_settings.modal("hide")
                })
            }
            


            
        }
        else{
            message_box_info("no new face id!")
        }
    })

    popap_faceId_settings.on("show.bs.modal",()=>{
        check_login(false,success_command=(data)=>{
            defualt_face = data.face_image
            defualt_face_box.css("background-image",`url(${data.face_image})`)
        })
    })

    popap_faceId_settings.on("hidden.bs.modal",()=>{
        if(stream)
            stream.getTracks().forEach(track => track.stop());
        video_capture.srcObject = null
        capture_box.css("background-image",`none`)
        video_capture.addClass("d-none")
        capture_btns.addClass("d-none")
        capture_box.addClass("d-none")

        defualt_face_box.removeClass("d-none")
        defualt_capture_btns.removeClass("d-none")

        face_data_url = null
        new_face = false

        popap_faceId_settings.find(".form-error").html("")
    })

    // end edit popap group detail codes


})