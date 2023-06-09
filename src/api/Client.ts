export type SearchResults = {
    corrected: boolean
    suggestion: string
    nextpage: string
    items: SeachResultItem[]
}

export type SeachResultItem = SearchResultPlaylist | SearchResultStream

export type SearchResultStream = {
    duration: number
    isShort: boolean
    shortDescription: string | null
    thumbnail: string
    title: string
    type: SearchResultItemTypes
    uploaded: number
    uploadedDate: number | null
    uploaderAvatar: string | null
    uploaderName: string
    uploaderUrl: string
    uploaderVerified: boolean
    url: string
    views: number
}

export type SearchResultPlaylist = {
    name: string
    playlistType: string
    thumbnail: string
    type: SearchResultItemTypes
    uploaderName: string
    uploaderUrl: string | null
    uploaderVerified: boolean
    url: string
    videos: number
}

export type SearchResultItemTypes = 'stream' | 'playlist' | 'channel'

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
    thumbnails: Thumbnail[]
}

export type ChartArtist = {
    id: string
    title: string
    thumbnails: Thumbnail[]
}

export type Thumbnail = {
    height: number
    width: number
    url: string
}

export type Stream = {
    audioStreams: AudioStream[]
    category: string
    chapters: Chapter[]
    dash: null | string
    description: string
    dislikes: number
    duration: number
    hls: string
    lbryId: null | number
    likes: number
    livestream: boolean
    previewFrames: any[]
    proxyUrl: string
    relatedStreams: RealtedStream[]
    subtitles: any[]
    thumbnailUrl: string
    title: string
    uploadDate: string
    uploader: string
    uploaderAvatar: string
    uploaderSubscriberCount: number
    uploaderUrl: string
    uploaderVerified: boolean
    videoStreams: VideoStream[]
    views: number
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

export const emptyStream = {
    audioStreams: [],
    category: '',
    chapters: [],
    dash: null,
    description: '',
    dislikes: 0,
    duration: 0,
    hls: '',
    lbryId: null,
    likes: 0,
    livestream: false,
    previewFrames: [],
    proxyUrl: '',
    relatedStreams: [],
    subtitles: [],
    thumbnailUrl: '',
    title: 'no song selected',
    uploadDate: '',
    uploader: 'browse or search a song or playlist to be played',
    uploaderAvatar: '',
    uploaderSubscriberCount: 0,
    uploaderUrl: '',
    uploaderVerified: true,
    videoStreams: [],
    views: 0
}

export type QueueElement = Stream & {
    id: string
    hqAudioSrc: string
    lqAudioSrc: string
    hqVideoSrc: string
    lqVideoSrc: string
    startAt?: number
}

export type ChannelData = {
    browsePlaylistId: string
    description: string
    thumbnails: Thumbnail[]
    subscriberCount: string
    title: string
    playlistId: string
    more: {
        albums: { params: string; click: string; visit: string }
        singles: { params: string; click: string; visit: string }
    }
    items: {
        albums: { id: string; title: string; subtitle: string; thumbnails: Thumbnail[] }[]
        recommendedArtists: { id: string; title: string; subtitle: string; thumbnails: Thumbnail[] }[]
        singles: { id: string; title: string; subtitle: string; thumbnails: Thumbnail[] }[]
        songs: { id: string; title: string; subtitle: string; subId: string; thumbnails: Thumbnail[] }[]
    }
}

export type Playlist = {
    title: string
    subtitle: string
    created: number
    modified: number
    hasOfflineSongs: boolean
    thumbnailUrl?: string
    items: Stream[]
    id: string
}

export type PublicPlaylist = Omit<Playlist, 'items'> & {
    uploaderName: string
    nextPage: string | null
    bannerUrl: string | null
    uploaderUrl: string
    uploaderAvatar: string
    streams: RealtedStream[]
}
