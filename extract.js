const { spawn }=require("child_process");
const fs = require('fs');
const path=require('path');

//short https://youtu.be/hH6yu19Ui4s
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
function downloader(video_link,parsing_result){
    if (!fs.existsSync("video")){
        fs.mkdirSync("video");
    }
    const action=spawn("yt-dlp", ["-P","video","-f", "bestvideo", video_link])
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
        extractor(getFileName(parsing_result,"video"),"video/")
    });
}
function downloader_audio(video_link){
    const action=spawn("yt-dlp", ["-P","result","-x","--audio-format","mp3", video_link])
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
    });
}
function extractor(video_src,folder){
    var jpglink=path.basename(video_src,path.extname(video_src))+".jpg";
    const action=spawn("ffmpeg", ["-i", folder+video_src, "-frames:v", "1","result/"+jpglink])
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
        fs.unlinkSync(folder+video_src)
    });
}
function links_from_source(){
    var out=(fs.readFileSync('source.txt','utf-8',function(err,data){
        if (err) return;
        return data
    })).split('\r\n')
    return out
}
function proc(link){ //code which process video
var parsing_result=link_parser(link)
if (parsing_result=="error"){
    console.log("Your input is not link or your link is incorrect!")
    return
}
if (!fs.existsSync("result")){
    fs.mkdirSync("result");
}
downloader_audio(link)
downloader(link,parsing_result)
}

// main
var link_arr=links_from_source()
for (var j in link_arr){proc(link_arr[j])}
//console.log("The end!")