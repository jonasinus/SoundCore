import { useEffect, useState } from 'react'
import { AudioStream, ChartResults, Playlist, PublicPlaylist, QueueElement, Regions, Stream, VideoStream } from '../api/Client'

import './default.css'

export default function SoundCore() {
    const [queue, setQueue] = useState<QueueElement[]>([])
    const [queueIndex, setQueueIndex] = useState(queue.length - 1)

    const API_URL = 'https://watchapi.whatever.social/'
    const API_2_URL = 'https://hyperpipeapi.onrender.com/'

    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [publicPlaylists, setPublicPlaylists] = useState<PublicPlaylist[]>([])
    const [charts, setCharts] = useState<{ region: Regions; charts: ChartResults }[]>([])

    const [playing, setPlaying] = useState(false)

    let playlistHandler: ReturnType<typeof PlaylistHandler> | null = null

    useEffect(() => {
        console.log('queue changed: ', queue)
        if (queueIndex >= queue.length) setQueueIndex(queue.length - 1)
        if (getCurrentSong() == null && queue.length > 0) nextSong()
    }, [queue])

    useEffect(() => {
        console.log('queueIndex changed: ', queueIndex)
    }, [queueIndex])

    useEffect(() => {
        const handleMediaSessionNext = () => {
            console.log('mediasession: next')
            nextSong()
        }

        const handleMediaSessionPrev = () => {
            console.log('mediasession: prev')
            prevSong()
        }

        const handlePlayPause = () => {
            setPlaying(!playing)
        }

        // Check if the mediaSession API is supported by the browser
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('nexttrack', handleMediaSessionNext)
            navigator.mediaSession.setActionHandler('previoustrack', handleMediaSessionPrev)
            navigator.mediaSession.setActionHandler('play', handlePlayPause)
            navigator.mediaSession.setActionHandler('pause', handlePlayPause)
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('nexttrack', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
            }
        }
    }, [])

    async function initPlaylistEngine() {
        playlistHandler = PlaylistHandler({ playlists, setPlaylists, API_URL, API_2_URL, publicPlaylists, setPublicPlaylists })
    }

    function getPlaylistHandler() {
        return playlistHandler
    }

    async function fetchStream(id: string): Promise<Stream | null> {
        let res = await (await fetch(API_URL + 'streams/' + id)).json()
        return res ? res : null
    }

    async function fetchCharts(region: Regions) {
        let res: ChartResults = await (await fetch(API_2_URL + 'charts?params=&code=' + region)).json()
        let chartsCopy = [...charts]
        let isThere = charts.findIndex((c) => c.region == region)
        if (isThere > -1) {
            console.log('isThere', isThere)

            chartsCopy[isThere].charts = res
        } else {
            chartsCopy.push({ region: region, charts: res })
        }
        return { region: region, charts: res }
    }

    function addQueueElementToQueue(element: QueueElement, index?: number) {
        let newQueue = [...queue]
        if (index) newQueue.splice(index, 0, element)
        else newQueue.splice(queueIndex + 1, 0, element)
        setQueue(newQueue)
    }

    async function addPublicPlaylistToQueue(id: string) {
        const playlist = publicPlaylists.find((e) => e.id === id)
        if (playlist) {
            const streams = playlist.streams

            for (let index = streams.length - 1; index >= 0; index--) {
                const stream = streams[index]
                const ids = stream.url.split('&')[0].substring(9)
                await addToQueue(ids)
            }

            console.log('Public playlist added to queue.')
        } else {
            alert('Public playlist (' + id + ') not found!')
        }
    }

    async function addPrivatePlaylistToQueue(title: string) {
        console.log(title, JSON.parse(localStorage.getItem(title) || '{}'))
    }

    async function addToQueue(id: string) {
        console.log('Adding song with id ' + id + ' to the queue')
        let stream = await fetchStream(id)

        if (stream != null) {
            setQueue((prevQueue) => {
                let newQueue = [...prevQueue]
                if (stream == null) return prevQueue
                let ratedAudioStreams = rateAudioStreams(stream.audioStreams)
                let ratedVideoStreams = rateVideoStreams(stream.videoStreams)
                newQueue.splice(queueIndex + 1, 0, {
                    ...stream,
                    id: id,
                    hqAudioSrc: ratedAudioStreams[0].url,
                    hqVideoSrc: ratedVideoStreams[0].url,
                    lqAudioSrc: ratedAudioStreams[ratedAudioStreams.length - 1].url,
                    lqVideoSrc: ratedVideoStreams[ratedVideoStreams.length - 1].url
                })

                if (newQueue.length === 1 && prevQueue.length === 0) {
                    setQueueIndex(0)
                }

                return newQueue
            })
        } else {
            console.error('Error retrieving song data of ' + id)
        }
    }

    useEffect(() => {
        console.log({ playlists, publicPlaylists })
    }, [playlists, publicPlaylists])

    function removeFromQueue(index: number) {
        if (index >= 0 && index <= queue.length - 1) {
            let newQueue = [...queue]
            newQueue.splice(index, 1)
            setQueue(newQueue)
            return true
        } else return false
    }

    function getQueue() {
        return queue
    }

    function getCurrentSong() {
        if (queue.length === 0 || queueIndex > queue.length || queueIndex < 0) return null
        return queue[queueIndex]
    }

    function getNextSong() {
        if (queue.length <= queueIndex + 1) return null
        return queue[queueIndex + 1]
    }

    function getPrevSong() {
        if (queueIndex - 1 < 0) return null
        return queue[queueIndex - 1]
    }

    function nextSong() {
        if (queueIndex < queue.length - 1) {
            setQueueIndex((prevIndex) => (prevIndex == 0 ? prevIndex + 2 : prevIndex + 1))
        } else {
            console.log('reached the end of the queue')
        }
    }

    function prevSong() {
        if (queueIndex > 0) {
            setQueueIndex((prevIndex) => prevIndex - 1)
        } else {
            console.log('reached the start of the queue')
        }
    }

    function getQueueIndex() {
        return queueIndex
    }

    function clearQueue() {
        setQueue([])
    }

    function rateAudioStreams(streams: AudioStream[]): AudioStream[] {
        if (streams.length === 0) return []
        let sortedStreams = [...streams].sort((a, b) => {
            let numA = parseInt(a.quality.substring(0, a.quality.length - 4))
            let numB = parseInt(b.quality.substring(0, b.quality.length - 4))
            return numA - numB
        })

        return sortedStreams
    }

    function rateVideoStreams(streams: VideoStream[]): VideoStream[] {
        if (streams.length === 0) {
            return []
        }

        // Sort the streams in descending order based on height and then bitrate
        const sortedStreams = [...streams].sort((a, b) => {
            if (a.height === b.height) {
                return b.bitrate - a.bitrate
            }
            return b.height - a.height
        })

        // Return the stream with the highest quality (first element after sorting)
        return sortedStreams
    }

    function filterTitle(title: string) {
        const regex = /(\[.*?\]|\(.*?\))/g
        const filteredTitle = title.replace(regex, '').trim()
        return filteredTitle
    }
    function truncateTitle(title: string, maxLength = 30) {
        if (title.length <= maxLength) {
            return title
        }
        return title.slice(0, maxLength) + '…'
    }

    function resumeLastPlayed() {
        let ls = localStorage.getItem('currentlyPlaying')

        if (ls) {
            let json = JSON.parse(ls)
            addQueueElementToQueue(json)
        }
    }

    async function getCharts(region: Regions) {
        let isThereOne = charts.find((c) => c.region === region)
        if (isThereOne) return isThereOne
        else {
            let el = await fetchCharts(region)
            setCharts([...charts, el])
            return el
        }
    }

    return {
        getQueue,
        getQueueIndex,
        getCurrentSong,
        getNextSong,
        getPrevSong,
        clearQueue,
        addToQueue,
        addQueueElementToQueue,
        removeFromQueue,
        nextSong,
        prevSong,
        resumeLastPlayed,
        filterTitle,
        truncateTitle,
        initPlaylistEngine,
        getPlaylistHandler,
        fetchCharts,
        getCharts,
        addPrivatePlaylistToQueue,
        addPublicPlaylistToQueue,
        API_URL,
        API_2_URL,
        playlists,
        publicPlaylists,
        playing,
        setPlaying
    }
}

interface PlaylistHandlerProps {
    setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>
    playlists: Playlist[]
    API_URL: string
    API_2_URL: string
    publicPlaylists: PublicPlaylist[]
    setPublicPlaylists: React.Dispatch<React.SetStateAction<PublicPlaylist[]>>
}

export function PlaylistHandler(props: PlaylistHandlerProps) {
    function loadAll() {
        let ls = { ...localStorage }
        //let playlistIds = JSON.parse(localStorage.getItem('playlistIds') || '[]')
        let publicPlaylists: PublicPlaylist[] = []
        let privatePaylists: Playlist[] = []

        for (let key in Object.keys(ls)) {
            let keyString = Object.keys(ls)[key]
            console.log(keyString, JSON.parse(ls[keyString]))

            if (keyString.startsWith('playlist_public_')) {
                publicPlaylists.push(JSON.parse(ls[keyString]))
            }
            if (keyString.startsWith('playlist_private_')) {
                publicPlaylists.push(JSON.parse(ls[keyString]))
            }
        }

        console.log('playlists: ')
        console.log('public: ', publicPlaylists)
        console.log('private: ', privatePaylists)
        props.setPlaylists(privatePaylists)
        props.setPublicPlaylists(publicPlaylists)
        return { privatePaylists, publicPlaylists }
    }

    function getPlaylist(title: string) {
        props.playlists.forEach((e) => {
            if (e.title == title) return e
        })
        return null
    }

    function createPlaylist(title: string, subtitle: string, thumbnailUrl?: string) {
        let playlist: Playlist = {
            title: title,
            id: '',
            subtitle: subtitle,
            thumbnailUrl: thumbnailUrl,
            created: Date.now(),
            modified: Date.now(),
            hasOfflineSongs: false,
            items: []
        }
        if (localStorage.getItem('playlist_private_' + title) != undefined) {
            localStorage.setItem('playlist_private_' + title, JSON.stringify(playlist))
        }
    }

    async function copyPublicPlaylist(id: string) {
        let res = await (await fetch(props.API_URL + 'playlists/' + id, { referrerPolicy: 'no-referrer' })).json()
        let playlist: PublicPlaylist = {
            title: res.name,
            id: id,
            subtitle: res.description,
            created: Date.now(),
            modified: Date.now(),
            hasOfflineSongs: false,
            thumbnailUrl: res.thumbnailUrl,
            uploaderName: res.uploadername,
            nextPage: res.nextPage,
            bannerUrl: res.bannerUrl,
            uploaderUrl: res.uploaderUrl,
            uploaderAvatar: res.uploaderAvatar,
            streams: res.relatedStreams
        }
        if (localStorage.getItem('playlist_public_' + playlist.title) != null) {
            return
        }
        localStorage.setItem('playlist_public_' + playlist.title, JSON.stringify(playlist))
    }

    return { loadAll, getPlaylist, createPlaylist, copyPublicPlaylist }
}
