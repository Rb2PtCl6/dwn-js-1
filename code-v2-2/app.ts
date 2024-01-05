import * as fs from 'node:fs'
import * as path from 'node:path'
import { spawn } from 'child_process'

const additional_path = `${__dirname}/`

const source = `${additional_path}source.txt`
const video = `${additional_path}video`
const result = `${additional_path}result`

enum commands {
    ffmpeg = "ffmpeg",
    yt_dlp = "yt-dlp",
}

const callbacks = { [commands.yt_dlp]: extract_link, [commands.ffmpeg]: delete_original }

function create_directory_if_necessary(names: string[]) {
    for (var i of names) {
        if (!fs.existsSync(i)) {
            fs.mkdirSync(i)
            console.log(`${i} created!`)
        }
    }
}
function get_links_from_source() : string[] {
    return (fs.readFileSync(source, 'utf-8')).split('\r\n')
}

function is_valid_url(this_url: string): boolean {
    var res = this_url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
    return (res !== null)
}

function parse_link(video_link: string) : ( string | null ) {
    if (!is_valid_url(video_link)) {
        return null
    }
    var url : URL
    try {
        url = new URL(video_link)
    } catch (e) {
        return null
    }
    switch (url.hostname) {
        case "youtu.be":
            return (url.pathname).substring(1)
        case "www.youtube.com":
        case "m.youtube.com":
        case "music.youtube.com":
            return url.searchParams.get("v")
        default:
            return null
    }
}

function is_alredy_exist(parsing_result : string) : boolean {
    var files_list = fs.readdirSync(result)
    for (var i in files_list) {
        if (files_list[i].indexOf(parsing_result) >= 0) {
            return true
        }
    }
    return false
}

function get_file_name(video_id : string) : (string | undefined) {
    var files_list = fs.readdirSync(`${additional_path}video`)
    for (var i in files_list) {
        if (files_list[i].indexOf(video_id) >= 0) {
            return files_list[i]
        }
    }
    return undefined
}

enum accepted_types {
    audio = 1,
    video,
}

function download_link(type: accepted_types, link: string, parsing_result: string) {
    var params: string[]
    if (type == accepted_types.audio) {
        params = ["-P", result, "-x", "--audio-format", "mp3", link]
    } else {
        params = ["-P", video, "-f", "bestvideo", link]
    }
    execute_command(commands.yt_dlp, params, parsing_result, type)
}

function extract_link(parsing_result: string) {
    var video_name = get_file_name(parsing_result)
    if (video_name != undefined) { 
        var jpglink = path.basename(video_name, path.extname(video_name)) + ".jpg"
        var video_name_extended: string = `${video}/${video_name}`
        var params: string[] = ["-i", video_name_extended, "-frames:v", "1", `${result}/${jpglink}`]
        console.log(video_name_extended)
        execute_command(commands.ffmpeg, params, video_name_extended)
    }
}

function delete_original(path: string) {
    fs.unlinkSync(path)
}

function execute_command(command: commands, params: string[], next: string, type?: accepted_types) {
    const action = spawn(command, params)
    action.stdout.on("data", data => {
        console.log(`stdout: ${data}`)
    })
    action.stderr.on("data", data => {
        console.log(`stderr: ${data}`)
    })
    action.on('error', (error) => {
        console.log(`error: ${error.message}`)
    })
    action.on("close", code => {
        console.log(`child process exited with code ${code}`)
        if (command == commands.yt_dlp) {
            if (type == accepted_types.video) callbacks[command](next)
        } else {
            callbacks[command](next)
        }
    })
}

function process_link(link: string) {
    var parsing_result = parse_link(link)
    if (parsing_result === null) {
        console.log(`Your input is not link or your link is incorrect! : ${link}`)
    } else {
        if (is_alredy_exist(parsing_result)) {
            console.log(`Mp3 and cover is already downloaded! : ${link}`)
        } else {
            console.log(`Ok! : ${link}`)
            download_link(accepted_types.audio, link, parsing_result)
            download_link(accepted_types.video, link, parsing_result)
        }
    }
}

(function () {
    if (!fs.existsSync(source)) {
        console.log("Txt file 'source.txt' not found!")
    } else {
        create_directory_if_necessary([result, video])
        for (var i of get_links_from_source()) {
            if (i.slice(0, 3) == "// ") continue
            process_link(i)
        }
    }
}())