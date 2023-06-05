export type SearchResults = {
    corrected: boolean
    suggestion: string
    nextpage: string
    items: SeachResultItem[]
}

export type SeachResultItem = {
    duration: number
    isShort: boolean
    shortDescription: string | null
    thumbnail: string
    title: string
    type: string
    uploaded: number
    uploadedDate: number | null
    uploaderAvatar: string | null
    uploaderName: string
    uploaderUrl: string
    uploaderVerified: boolean
    url: string
    views: number
}

export type ChartResults = {
    options: {
        default: string
        all: { id: string; title: string }[]
    }
    artists: ChartArtist[]
    trending: ChartSong[]
}

export type ChartSong = {
    id: string
    title: string
    subtitle: string
    subId: string
    thumbnails: ChartThumbnail[]
}

export type ChartArtist = {
    id: string
    title: string
    thumbnails: ChartThumbnail[]
}

export type ChartThumbnail = {
    height: number
    width: number
    url: string
}

export type Stream = {
    audioStreams: AudioStream[]
    category: string
    chapters: []
    dash: null | string
    description: string
    dislikes: number
    duration: number
    hls: string
    lbryId: null | number
    likes: number
    livestream: boolean
    previewFrames: []
    proxyUrl: string
    relatedStreams: RealtedStream[]
    subtitles: []
    thumbnailUrl: string
    title: string
    uploadDate: string
    uploader: string
    uploaderAvatar: string
    uploaderSubscriberCount: number
    uploaderUrl: string
    uploaderVerified: boolean
    videoStreams: []
    views: string
}

export type RealtedStream = {
    url: string
    type: string
}

export type AudioStream = {
    audioTrackId: null | number
    audioTrackLocale: null | string
    audioTrackName: null | string
    audioTrackType: null | string
    bitrate: number
    codec: string
    contentLength: number
    format: string
    fps: number
    height: number
    indexEnd: number
    indexStart: number
    initEnd: number
    initStart: number
    mimeType: string
    quality: string
    url: string
    videoOnly: boolean
    width: number
}

export type VideoStream = {
    bitrate: number
    codec: string
    format: string
    fps: number
    height: number
    indexEnd: number
    indexStart: number
    initStart: number
    initEnd: number
    mimeType: string
    quality: string
    url: string
    videoOnly: boolean
    width: number
}

export type Chapter = {
    start: number
    title: string
    image: string
}

export type SearchTypes = 'songs' | 'albums' | 'artists' | 'playlists'

export type Regions = 'US' | 'DE' | 'GB' | 'CA'

export type SongId = string
