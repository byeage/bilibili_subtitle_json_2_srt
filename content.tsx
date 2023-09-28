import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    
    .ai-srt-download-button {
      position: fixed;
      right: 0;
      top: 0;
      height: 60px;
      line-height: 60px;
      color:#fff;
      background: #FF3A78;
      border: none;
      padding: 0 10px;
      cursor: pointer;
      transition: all 0.2 ease;
    }
    .ai-srt-download-button:hover {
      background: #FF0A78;
      transition: all 0.2 ease;
      font-weight: bold;
    }
  `
  return style
}
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // matches: ["*://member.bilibili.com/*"],
  world: "MAIN"
}

// get subtitle link
const getSubtitleLink = async () => {
  const searchQuery = new URLSearchParams(window.location.search)
  const params = {
    oid: searchQuery.get("cid"),
    subtitle_id: searchQuery.get("subtitleId")
  }
  const targetParams = new URLSearchParams(params)
  const cookies = document.cookie

  // request init
  const requestInit = {
    method: "GET",
    headers: {
      Cookie: cookies,
      accept: "application/json, text/plain, */*",
      "accept-language": "zh,zh-TW;q=0.9,zh-CN;q=0.8",
      "sec-ch-ua":
        '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    },
    referrer: "https://account.bilibili.com/subtitle/edit/",
    referrerPolicy: "unsafe-url",
    body: null,
    mode: "cors",
    credentials: "include"
  }
  return fetch(
    `https://api.bilibili.com/x/v2/dm/subtitle/show?${targetParams.toString()}`,
    requestInit as RequestInit
  ).then(async (response) => {
    const json = await response.json()
    const { subtitle_url, archive_name, id_str } = json.data
    return {
      url: subtitle_url.replace("http", "https"),
      filename: `${archive_name}-${id_str}.srt`
    }
  })
}

// utils get subtitle json
const getSubtitle = async (url) => {
  const response = await fetch(url)
  const data = response.json()
  return data
}

// utils download
function download(content, mimeType, filename) {
  const a = document.createElement("a") // Create "a" element
  const blob = new Blob([content], { type: mimeType }) // Create a blob (file-like object)
  const url = URL.createObjectURL(blob) // Create an object URL from blob
  a.setAttribute("href", url) // Set "a" element link
  a.setAttribute("download", filename) // Set download filename
  a.click() // Start downloading
}

// 时间格式转换
function timeConvert(time) {
  const milliseconds = time * 1000
  const millisecondsPart = (milliseconds % 1000).toFixed(0).padStart(3, "0")
  const date = new Date(milliseconds)
  const hours = date.getUTCHours().toString().padStart(2, "0")
  const minutes = date.getUTCMinutes().toString().padStart(2, "0")
  const seconds = date.getUTCSeconds().toString().padStart(2, "0")
  return `${hours}:${minutes}:${seconds},${millisecondsPart}`
}

// 生成字幕
function generateSrtSubtitle(data) {
  const list = data.map(({ from, to, sid, content }) => {
    const start = timeConvert(from)
    const end = timeConvert(to)
    return `${sid}\n${start} --> ${end}\n${content}`
  })

  return list.join("\n\n")
}

//

const isMatchTargetUrl = (url) => {
  const pattern =
    /https:\/\/member.bilibili.com\/platform\/zimu\/my-zimu\/zimu-editor\?bvid=.+&cid=.+&subtitleId=.+/
  return pattern.test(url)
}
// 下载字幕
const DownloadButton = () => {
  const [renderDownload, setRenderDownload] = useState(false)
  const handleDownload = async () => {
    const MIME_TYPE = "application/x-subrip"
    const { url, filename } = await getSubtitleLink()
    const data = await getSubtitle(url)
    const content = generateSrtSubtitle(data.body)
    download(content, MIME_TYPE, filename)
  }

  const checkShow = (url) => {
    const match = isMatchTargetUrl(url)
    setRenderDownload(match)
  }
  // init
  useEffect(() => {
    checkShow(window.location.href)

    const pushState = history.pushState
    history.pushState = function () {
      pushState.apply(history, arguments)
      checkShow(window.location.href)
    }
  }, [])

  return (
    renderDownload && (
      <button className="ai-srt-download-button" onClick={handleDownload}>
        AI幕下载
      </button>
    )
  )
}

export default DownloadButton
