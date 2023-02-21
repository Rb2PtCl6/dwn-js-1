const { spawn }=require("child_process");
const fs = require('fs');
const path=require('path');



//short https://youtu.be/X2DUpDxFJyg
//full https://www.youtube.com/watch?v=X2DUpDxFJyg
//music https://music.youtube.com/watch?v=I7RFELL_2dA
function link_parser(video_link){
    if (!isValidURL(video_link)){
        return "error"
    }
    const url=new URL(video_link)
    switch(url.hostname){
        case "youtu.be":
            return (url.pathname).substring(1)
        case "www.youtube.com":
            return url.searchParams.get("v")
        case "music.youtube.com":
            return url.searchParams.get("v")
        default:
            return "error"
    }
}
function isValidURL(string) {
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};
function getFileName(video_id,location){
    var files_list=fs.readdirSync(location);
    for (var i in files_list){
        if (files_list[i].indexOf(video_id) >= 0){
            return files_list[i]
        }
    }
}
function downloader(type, arg, video_link){
    /*if (arg!="bestvideo" || arg=="bestaudio"){
        console.log(`${arg} is incorrect argument. Correct argument is bestaudio or bestvideo`)
        return
    }
    if (type=="audio" || type=="video"){
        console.log(`${type} is incorrect argument. Correct argument is audio or video`)
        return
    }*/
    if (!fs.existsSync(type)){
        fs.mkdirSync(type);
    }
    const action=spawn("yt-dlp", ["-P",type,"-f", arg, video_link])
    action.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });
    action.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    
    action.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });
    
    action.on("close", code => {
        console.log(`child process exited with code ${code}`);
        if (type=="audio"){
            audio_converter(getFileName(parsing_result,type),type)
        } else {
            extractor(getFileName(parsing_result,type),type)
        }
    });
}
function audio_converter(video_src,folder){
    var mp3link;
    if (path.extname(video_src)==".webm"){
        mp3link=video_src.replace(".webm",".mp3")
    } else if (path.extname(video_src)==".mp4"){
        mp3link=video_src.replace(".mp4",".mp3")
    }
    const action=spawn("ffmpeg", ["-i", folder+"/"+video_src, folder+"/"+mp3link])
    action.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });
    action.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    action.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });
    action.on("close", code => {
        console.log(`child process exited with code ${code}`);
        fs.unlinkSync(folder+"/"+video_src)
        fs.copyFileSync(folder+"/"+mp3link,mp3link)
        fs.unlinkSync(folder+"/"+mp3link)
    });
}
function extractor(video_src,folder){
    var jpglink;

    if (path.extname(video_src)==".webm"){
        jpglink=video_src.replace(".webm",".jpg")
    } else if (path.extname(video_src)==".mp4"){
        jpglink=video_src.replace(".mp4",".jpg")
    }
    console.log(jpglink+" "+ typeof jpglink)

    const action=spawn("ffmpeg", ["-i", folder+"/"+video_src, "-frames:v", "1",folder+"/"+jpglink])
    action.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });
    action.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });
    action.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });
    action.on("close", code => {
        console.log(`child process exited with code ${code}`);
        fs.unlinkSync(folder+"/"+video_src)
        fs.copyFileSync(folder+"/"+jpglink,jpglink)
        fs.unlinkSync(folder+"/"+jpglink)
    });
}

// main
for(var zone=1;zone<2; zone++){
var local_link="https://www.youtube.com/watch?v=I7RFELL_2dA";
if (local_link=="1"){
    break
}
var parsing_result=link_parser(local_link)
if (parsing_result=="error"){
    console.log("Your input is not link or your link is incorrect!")
    continue
}
downloader("audio","bestaudio",local_link)
downloader("video","bestvideo",local_link)
}
//console.log("The end!")