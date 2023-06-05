import { useEffect, useState } from 'react'
import './App.css'
import {
    AudioStream,
    ChartResults,
    ChartThumbnail,
    Regions,
    SearchResults,
    SearchTypes,
    SongId,
    Stream,
    VideoStream
} from './api/Client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Player from './Components/Player'
import { SearchPage } from './Routes/search'
import PlaylistsPage from './Routes/playlists'
import AccountPage from './Routes/account'
import { ChartsPage } from './Routes/charts'

export const API_URL = 'https://watchapi.whatever.social'
export const API_2_URL = 'https://hyperpipeapi.onrender.com'

export type FetchError = {
    error: string
    details: Promise<string>
}

export const searchPath = (query: string, filter: SearchTypes) =>
    `/search?filter=music_${filter}&q=${query}`
export const extendedSearchPath = (query: string) => `/search?filter=all&q=${query}`

export const chartPath = (region: Regions) => `/charts?code=${region}&params=`

export const linkToSong = (id: string) => `${API_URL}/streams/${id}`

export async function fetchSearchResults(
    query: string,
    filter: SearchTypes
): Promise<SearchResults> {
    let f = await fetch(API_URL + searchPath(query, filter), {
        referrerPolicy: 'no-referrer'
    })
    if (f.status == 200) return f.json()
    throw new Error(JSON.stringify({ error: f.statusText, details: f.text() }))
}

export async function fetchExtendedSearchResults(query: string) {
    let f = await fetch(API_URL + extendedSearchPath(query), { referrerPolicy: 'no-referrer' })
    if (f.status == 200) return f.json()
    throw new Error(JSON.stringify({ error: f.statusText, details: f.text() }))
}

export async function fetchCharts(region: Regions): Promise<ChartResults> {
    let f = await fetch(API_2_URL + chartPath(region), { referrerPolicy: 'no-referrer' })
    if (f.status == 200) return f.json()
    else return { trending: [], options: { default: 'US', all: [] }, artists: [] }
}

export function rankThumbnails(thumbnails: ChartThumbnail[]) {
    return thumbnails.sort((a, b) => {
        const sizeA = a.width * a.height
        const sizeB = b.width * b.height

        return sizeB - sizeA
    })
}

export function filterTitle(title: string): string {
    const regex = /(\[.*?\]|\(.*?\))/g
    const filteredTitle = title.replace(regex, '').trim()
    return filteredTitle.trim().trimStart().trimEnd()
}

export function truncateTitle(title: string, maxLength = 20) {
    if (title.length <= maxLength) {
        return title
    }
    return title.slice(0, maxLength) + '…'
}

export const userConfig = {
    dataSaver: false,
    autoStart: true,
    playOn: true,
    resumeTracksIf: {
        minTrackDuration: 60 * 10
    }
}

export async function fetchStream(streamId: string): Promise<Stream> {
    let stream: Stream = await fetch(API_URL + '/streams/' + streamId).then((res) => res.json())
    return stream
}

function App() {
    //LiFo principle (last track added plays next)
    const [queue, setQueue] = useState<SongId[]>([])
    const [queueLength, setQueueLength] = useState(queue.length)
    const [currentlyPlaying, setCurrentlyPlaying] = useState<Stream>()
    const [nextSongData, setNextSongData] = useState<Stream>()
    const [src, setSrc] = useState('')

    function getNextSongId(): string {
        if (queue.length >= 1) {
            let c = queue[0]
            setQueue(queue.slice(queue.length - 1))
            return c
        } else if (!userConfig.playOn) {
            alert('track ended')
            return 'playOnIsOff'
        } else if (!currentlyPlaying || currentlyPlaying.relatedStreams.length == 0) {
            alert('no fitting stream could be found')
            return 'noStreamFound'
        } else {
            let filteredRelatedStreams = [...currentlyPlaying.relatedStreams].filter(
                (rs) => rs.type == 'stream'
            )
            if (filteredRelatedStreams.length == 0) {
                alert('no fitting stream could be found')
                return 'noStreamsRecommended'
            } else {
                return filteredRelatedStreams[0].url.split('=')[1]
            }
        }
    }

    useEffect(() => {
        console.log('queue changed: ', { queue, queueLength })
        if (queue.length === 1 && queueLength === 0) {
            //first song added to the queue
        } else if (queue.length === 0 && queueLength > 0) {
            //all songs from queue have been played
        } else if (queue.length === 0 && queueLength === 0) {
            //initial load of queue
        } else {
            //one song got added to the queue
        }
        setQueueLength(queue.length)
    }, [queue])

    useEffect(() => {
        console.log('currentplaying changed: ', currentlyPlaying)

        let newSrc = rankAudioStreams(currentlyPlaying?.audioStreams || [])
        if (newSrc == src || newSrc == 'noAudioStreamsAvailable') setSrc('')
        if (currentlyPlaying) setSrc(rankAudioStreams(currentlyPlaying.audioStreams))
        else setSrc('noSource')
    }, [currentlyPlaying])

    useEffect(() => {
        console.log('src changed:', src)
    }, [src])

    async function playnextSong() {
        if (queue.length === 0) {
            setCurrentlyPlaying(undefined)
        }
        console.log('playing next song in queue: ' + queue[0])
        let songId = queue[0]
        let newQueue = queue.slice(1)
        let streamData = await fetchStream(songId)
        setCurrentlyPlaying(streamData)
        setQueue(newQueue)
    }

    return (
        <BrowserRouter>
            <TopBar />
            <button onClick={playnextSong}>click me</button>
            <Routes>
                <Route
                    path='/search'
                    element={<SearchPage queue={queue} setQueue={setQueue} />}></Route>
                <Route
                    path='/charts'
                    element={<ChartsPage queue={queue} setQueue={setQueue} region={'US'} />}
                />
                <Route
                    path='/playlists'
                    element={<PlaylistsPage queue={queue} setQueue={setQueue} />}
                />
                <Route path='/account' element={<AccountPage />} />
            </Routes>
            <Player currentlyPlaying={currentlyPlaying} next={playnextSong} src={src} />
            <Nav />
        </BrowserRouter>
    )
}

export function TopBar() {
    return <div className='top-bar'></div>
}

interface SongInListProps {
    title: string
    songId: string
    artist: string
    artistId: string
    playlist: string
    thumbnailUrl: string
    liked: boolean
    queue: SongId[]
    setQueue: React.Dispatch<React.SetStateAction<SongId[]>>
}
export function SongInList(props: SongInListProps) {
    return (
        <div
            className='song-in-list'
            title={props.title + ' | ' + props.artist}
            onClick={async () => {
                props.setQueue([...props.queue, props.songId])
            }}>
            <img loading='lazy' src={props.thumbnailUrl} alt='' className='icon' />
            <div className='infos'>
                <p className='title'>{truncateTitle(filterTitle(props.title))}</p>
                <p
                    className='subtitle'
                    onClick={() => console.log('goto artist[' + props.artistId + ']')}>
                    {props.artist}
                </p>
            </div>
            <button type='button' className='like-button'>
                <img
                    loading='lazy'
                    src='./heart.svg'
                    alt='fav'
                    className={props.liked ? 'filled' : ''}
                />
            </button>
        </div>
    )
}

export function Nav() {
    return (
        <div className='nav'>
            <Link to={'/charts'}>
                <img src='./home.svg' alt='home' className='scale-down-light' />
            </Link>
            <Link to={'/search'}>
                <img src='./search.svg' alt='search' className='scale-down' />
            </Link>
            <Link to={'/playlists'}>
                <img src='./playlist.svg' alt='playllist' />
            </Link>
            <Link to={'/account'}>
                <img src='./account.svg' alt='acc' />
            </Link>
        </div>
    )
}

export function linkTo(path: string): void {
    if (window.location.href.includes(path)) return
    window.location.href = path
}

export default App

function rankAudioStreams(streams: AudioStream[]): string {
    if (streams.length === 0) return 'noAudioStreamsAvailable'
    let sortedStreams = [...streams].sort((a, b) => {
        let numA = parseInt(a.quality.substring(0, a.quality.length - 4))
        let numB = parseInt(b.quality.substring(0, b.quality.length - 4))
        return numA - numB
    })

    return sortedStreams[0].url
}

function rankVideoStreams(streams: VideoStream[]): string {
    if (streams.length === 0) {
        return ''
    }

    const filteredStreams = [...streams].filter((s) => !s.videoOnly)
    if (filteredStreams.length == 0) return ''

    // Sort the streams in descending order based on height and then bitrate
    const sortedStreams = [...filteredStreams].sort((a, b) => {
        if (a.height === b.height) {
            return b.bitrate - a.bitrate
        }
        return b.height - a.height
    })

    // Return the stream with the highest quality (first element after sorting)
    return sortedStreams[0].url
}
