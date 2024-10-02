"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const child_process_1 = require("child_process");
const additional_path = `${__dirname}/`;
const source = `${additional_path}source.txt`;
const video = `${additional_path}video`;
const result = `${additional_path}result`;
var commands;
(function (commands) {
    commands["ffmpeg"] = "ffmpeg";
    commands["yt_dlp"] = "yt-dlp";
})(commands || (commands = {}));
const callbacks = { [commands.yt_dlp]: extract_link, [commands.ffmpeg]: delete_original };
function create_directory_if_necessary(names) {
    for (var i of names) {
        if (!fs.existsSync(i)) {
            fs.mkdirSync(i);
            console.log(`${i} created!`);
        }
    }
}
function get_links_from_source() {
    return (fs.readFileSync(source, 'utf-8')).split('\r\n');
}
function is_valid_url(this_url) {
    var res = this_url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null);
}
function parse_link(video_link) {
    if (!is_valid_url(video_link)) {
        return null;
    }
    var url;
    try {
        url = new URL(video_link);
    }
    catch (e) {
        return null;
    }
    switch (url.hostname) {
        case "youtu.be":
            return (url.pathname).substring(1);
        case "www.youtube.com":
        case "m.youtube.com":
        case "music.youtube.com":
            return url.searchParams.get("v");
        default:
            return null;
    }
}
function is_alredy_exist(parsing_result) {
    var files_list = fs.readdirSync(result);
    for (var i in files_list) {
        if (files_list[i].indexOf(parsing_result) >= 0) {
            return true;
        }
    }
    return false;
}
function get_file_name(video_id) {
    var files_list = fs.readdirSync(`${additional_path}video`);
    for (var i in files_list) {
        if (files_list[i].indexOf(video_id) >= 0) {
            return files_list[i];
        }
    }
    return undefined;
}
var accepted_types;
(function (accepted_types) {
    accepted_types[accepted_types["audio"] = 1] = "audio";
    accepted_types[accepted_types["video"] = 2] = "video";
})(accepted_types || (accepted_types = {}));
function download_link(type, link, parsing_result) {
    var params;
    if (type == accepted_types.audio) {
        params = ["-P", result, "-x", "--audio-format", "mp3", link];
    }
    else {
        params = ["-P", video, "-f", "bestvideo", "--download-sections", "*00:00-00:01", link];
    }
    execute_command(commands.yt_dlp, params, parsing_result, type);
}
function extract_link(parsing_result) {
    var video_name = get_file_name(parsing_result);
    if (video_name != undefined) {
        var jpglink = path.basename(video_name, path.extname(video_name)) + ".jpg";
        var video_name_extended = `${video}/${video_name}`;
        var params = ["-i", video_name_extended, "-frames:v", "1", `${result}/${jpglink}`];
        console.log(video_name_extended);
        execute_command(commands.ffmpeg, params, video_name_extended);
    }
}
function delete_original(path) {
    fs.unlinkSync(path);
}
function execute_command(command, params, next, type) {
    const action = (0, child_process_1.spawn)(command, params);
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
        if (command == commands.yt_dlp) {
            if (type == accepted_types.video)
                callbacks[command](next);
        }
        else {
            callbacks[command](next);
        }
    });
}
function process_link(link) {
    var parsing_result = parse_link(link);
    if (parsing_result === null) {
        console.log(`Your input is not link or your link is incorrect! : ${link}`);
    }
    else {
        if (is_alredy_exist(parsing_result)) {
            console.log(`Mp3 and cover is already downloaded! : ${link}`);
        }
        else {
            console.log(`Ok! : ${link}`);
            download_link(accepted_types.audio, link, parsing_result);
            download_link(accepted_types.video, link, parsing_result);
        }
    }
}
(function () {
    if (!fs.existsSync(source)) {
        console.log("Txt file 'source.txt' not found!");
    }
    else {
        create_directory_if_necessary([result, video]);
        for (var i of get_links_from_source()) {
            if (i.slice(0, 3) == "// ")
                continue;
            process_link(i);
        }
    }
}());
//# sourceMappingURL=app.js.map