import { useState, useEffect, useRef } from 'react'
import { userConfig, API_2_URL, API_URL } from '../../App'
import {
    AudioStream,
    Chapter,
    ChartResults,
    ChartThumbnail,
    Regions,
    SearchResults,
    SearchTypes,
    SongId,
    Stream,
    VideoStream,
    emptyStream
} from '../../api/Client'

type CurrentStream = Stream & {
    id: string
}

export default function SoundCore() {
    const [queue, setQueue] = useState<SongId[]>([])
    const [queueIndex, setQueueIndex] = useState(-1)
    const [queueLength, setQueueLength] = useState(queue.length)
    const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentStream>()
    const [nextSongData, setNextSongData] = useState<CurrentStream>()
    const [src, setSrc] = useState('')
    const [isLoading, setLoading] = useState(false)

    function playNextSong() {
        if (nextSongData) {
            setCurrentlyPlaying(nextSongData)
            setQueueIndex(queueIndex + 1)
        }
    }

    useEffect(() => {
        if (queue[queueIndex + 1]) playAsNextSong(queue[queueIndex + 1])
        else console.log('reaching end of queue after this song')
    }, [queueIndex])

    function playLastSong() {
        if (queueIndex >= 1) {
        }
    }

    async function playAsNextSong(id: SongId) {
        let res = await fetchStream(id)
        setNextSongData({ ...res, id: id })
    }

    useEffect(() => {
        if (!currentlyPlaying) {
            if (!nextSongData) {
                resumePlayback()
            } else {
                setCurrentlyPlaying(nextSongData)
            }
        }
    }, [])

    function resumePlayback() {
        let resumeObj = JSON.parse(localStorage.getItem('currentlyPlaying') || '{}')
        console.log('resuming', resumeObj)
    }

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

    const searchPath = (query: string, filter: SearchTypes) => `/search?filter=music_${filter}&q=${query}`
    const extendedSearchPath = (query: string) => `/search?filter=all&q=${query}`

    const chartPath = (region: Regions) => `/charts?code=${region}&params=`

    const linkToSong = (id: string) => `${API_URL}/streams/${id}`

    async function fetchSearchResults(query: string, filter: SearchTypes): Promise<SearchResults> {
        let f = await fetch(API_URL + searchPath(query, filter), {
            referrerPolicy: 'no-referrer'
        })
        if (f.status == 200) return f.json()
        throw new Error(JSON.stringify({ error: f.statusText, details: f.text() }))
    }

    async function fetchExtendedSearchResults(query: string) {
        let f = await fetch(API_URL + extendedSearchPath(query), { referrerPolicy: 'no-referrer' })
        if (f.status == 200) return f.json()
        throw new Error(JSON.stringify({ error: f.statusText, details: f.text() }))
    }

    async function fetchCharts(region: Regions): Promise<ChartResults> {
        let f = await fetch(API_2_URL + chartPath(region), { referrerPolicy: 'no-referrer' })
        if (f.status == 200) return f.json()
        else return { trending: [], options: { default: 'US', all: [] }, artists: [] }
    }

    function rankThumbnails(thumbnails: ChartThumbnail[]) {
        return thumbnails.sort((a, b) => {
            const sizeA = a.width * a.height
            const sizeB = b.width * b.height

            return sizeB - sizeA
        })
    }

    function filterTitle(title: string): string {
        const regex = /(\[.*?\]|\(.*?\))/g
        const filteredTitle = title.replace(regex, '').trim()
        return filteredTitle.trim().trimStart().trimEnd()
    }

    function truncateTitle(title: string, maxLength = 20) {
        if (title.length <= maxLength) {
            return title
        }
        return title.slice(0, maxLength) + '…'
    }

    async function fetchStream(streamId: string): Promise<Stream> {
        let stream: Stream = await fetch(API_URL + '/streams/' + streamId).then((res) => res.json())
        return stream
    }

    function addToQueue(id: SongId) {
        setQueue([...queue, id])
    }

    function removeFromQueue(id?: SongId, index?: number) {
        let newQueue = [...queue]
        if (id != undefined) {
            newQueue = newQueue.filter((s) => s != id)
        } else if (index != undefined) {
            if (index > 0 && index < queue.length) newQueue = queue.splice(index, 1)
        }
        setQueue(newQueue)
    }

    interface PlayerProps {
        next: () => void
        currentlyPlaying: CurrentStream | undefined
        src: string
    }

    function Player(props: PlayerProps) {
        const audioElement = useRef<HTMLAudioElement | null>(null)
        const [playing, setPlaying] = useState(false)
        const [progres, setProgres] = useState(0)

        const [isLooped, setIsLooped] = useState(false)
        const loopRef = useRef<{ position: number; duration: number } | null>(null) // Store loop position and duration

        const [isSwipedUp, setIsSwipedUp] = useState(true)
        //const [startY, setStartY] = useState(0)
        //const [offsetY, setOffsetY] = useState(0)
        const playerRef = useRef<HTMLDivElement>(null)

        const [fullLoop, setFullLoop] = useState(false)

        const [currentChapter, setCurrentChapter] = useState<Chapter>()

        //const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        //    const touch = event.touches[0]
        //    setStartY(touch.pageY)
        //}

        //const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        //    const touch = event.touches[0]
        //    const currentY = touch.pageY
        //    const delta = currentY - startY
        //
        //    setOffsetY(delta)
        //}

        //const handleTouchEnd = () => {
        //    if (offsetY < -50) {
        //        setIsSwipedUp(true)
        //    } else {
        //        setIsSwipedUp(false)
        //    }
        //    setOffsetY(0)
        //}

        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'MediaTrackNext' || event.keyCode == 176) {
                    // Keyboard media key or Bluetooth headphones shortcut for skipping to the next track
                    props.next()
                }
            }

            document.addEventListener('keydown', handleKeyDown)

            const handleMediaSessionNext = () => {
                props.next()
            }

            // Check if the mediaSession API is supported by the browser
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('nexttrack', handleMediaSessionNext)
            }

            return () => {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.setActionHandler('nexttrack', null)
                }
                document.removeEventListener('keydown', handleKeyDown)
            }
        }, [])

        function timeloop(position: number, duration: number) {
            console.log(`requesting loop from ${position}s for ${duration * 1000}ms. audioTrack is at ${audioElement.current?.currentTime}`)
            // Check if audio element reference is available
            if (!audioElement.current) {
                console.error('Audio element reference not available')
                return
            }

            const audio = audioElement.current

            // Check if position is within the track bounds
            if (position < 0 || position >= audio.duration) {
                console.error('Invalid position')
                return
            }

            // Check if loop duration is too long
            if (duration <= 0 || position + duration > audio.duration) {
                console.error('Invalid loop duration')
                return
            }

            // Set loop position and duration
            loopRef.current = { position, duration }

            // Start playing the audio
            audio.currentTime = position
            audio.play()

            // Set isLooped to true
            setIsLooped(true)
        }

        useEffect(() => {
            // Add the timeupdate event listener to handle looping
            const handleTimeUpdate = () => {
                if (isLooped && loopRef.current && audioElement.current) {
                    const { position, duration } = loopRef.current

                    const audio = audioElement.current
                    const currentTime = audio.currentTime

                    // Check if the current playback position exceeds the loop end time
                    if (currentTime >= position + duration) {
                        console.log(`looping back from ${currentTime} to ${position}`)
                        // Update the playback position to the loop start time
                        audio.currentTime = position
                    }
                }
            }

            if (audioElement.current) {
                audioElement.current.addEventListener('timeupdate', handleTimeUpdate)
            }

            console.log('isLooped updated: ', isLooped)

            return () => {
                if (audioElement.current) {
                    audioElement.current.removeEventListener('timeupdate', handleTimeUpdate)
                }
            }
        }, [isLooped])

        const handleProgress = (event: React.SyntheticEvent<HTMLAudioElement>) => {
            const audioElement = event.currentTarget
            const currentTime = audioElement.currentTime
            setProgres(audioElement.currentTime)
            setCurrentChapter(getChapter(currentTime))
            localStorage.setItem(
                'currentlyPlaying',
                JSON.stringify({
                    title: props.currentlyPlaying?.title,
                    src: props.src,
                    thumbnails: props.currentlyPlaying?.thumbnailUrl,
                    audioStreams: props.currentlyPlaying?.audioStreams,
                    id: props.currentlyPlaying?.id,
                    looped: isLooped,
                    loopRef: loopRef,
                    position: audioElement.currentTime
                })
            )
            if (currentTime >= audioElement.duration - 1) {
                if (!fullLoop) setTimeout(() => props.next(), 500)
                else audioElement.currentTime = 0
            }
        }

        const handleSeekTo = (event: React.MouseEvent) => {
            const x = event.clientX
            let toSecond = (x / event.currentTarget.clientWidth) * (audioElement.current?.duration || 1)
            audioElement.current!.currentTime = toSecond
        }

        function getChapter(currentTime: number): Chapter {
            let currentChapter: Chapter = {
                start: 0,
                title: 'no chapters in this stream',
                image: ''
            }
            if (props.currentlyPlaying && props.currentlyPlaying.chapters.length > 0) {
                let chapters: Chapter[] = props.currentlyPlaying.chapters
                chapters.forEach((e) => {
                    if (currentTime - e.start >= 0) currentChapter = e
                })
            }
            return currentChapter
        }

        return (
            <div
                className={`player ${isSwipedUp ? 'swiped-up' : ''} ${
                    audioElement.current && audioElement.current.src && audioElement.current.currentSrc !== '' && audioElement.current.currentSrc != undefined
                        ? 'track-loaded'
                        : 'no-track-loaded'
                }`}
                data-stream-obj={JSON.stringify(props.currentlyPlaying)}
                data-src={props.src}
                ref={playerRef}>
                <audio
                    controls
                    onTimeUpdate={handleProgress}
                    ref={audioElement}
                    hidden
                    src={props.src}
                    onCanPlay={(e) => {
                        if (userConfig.autoStart) {
                            e.currentTarget.play()
                            setPlaying(true)
                        }
                        return true
                    }}></audio>
                <h2 className='back' onClick={() => setIsSwipedUp(!isSwipedUp)}>
                    ———
                </h2>
                <div className='minimal'>
                    <button>&lt;</button>
                    <button onClick={() => setPlaying(!playing)}>
                        {playing ? <img src='./pause.svg' alt='pause' /> : <img src='./play.svg' alt='play' />}
                    </button>
                    <button>&gt;</button>
                </div>
                <div className='expand'>
                    <div className='img-container'>
                        <img loading='lazy' src={props.currentlyPlaying?.thumbnailUrl} alt='cover' className='cover' />
                    </div>
                    <div className='infos' title={props.currentlyPlaying?.title + ' by ' + props.currentlyPlaying?.uploader + ', chapter: ' + currentChapter}>
                        <p className='title'>{props.currentlyPlaying?.title}</p>
                        <p className='artist'>{props.currentlyPlaying?.uploader}</p>
                    </div>
                    <div className='ctrls'>
                        <div className='vertical-bar'>
                            <button
                                className='seek'
                                onClick={() => {
                                    if (audioElement.current) {
                                        audioElement.current.currentTime -= 5
                                    }
                                }}>
                                <img src='./5sBackward.svg' alt='' />
                            </button>
                            <button className={'loop ' + isLooped ? 'active' : ''} onClick={() => setFullLoop(!fullLoop)}>
                                loop
                            </button>
                        </div>
                        <div className='vertical-bar'>
                            <button className='skip'>
                                <img src='./skipPrevious.svg' alt='<' />
                            </button>
                        </div>

                        <div className='vertical-bar'>
                            <button
                                type='button'
                                className='play'
                                onClick={() => {
                                    playing ? audioElement.current?.pause() : audioElement.current?.play()
                                    setPlaying(!playing)
                                }}>
                                {playing ? <img src='./pause.svg' alt='pause' /> : <img src='./play.svg' alt='play' />}
                            </button>
                        </div>
                        <div className='vertical-bar'>
                            <button onClick={props.next} className='skip'>
                                <img src='./skipNext.svg' alt='>' />
                            </button>
                        </div>

                        <div className='vertical-bar'>
                            <button
                                className='seek'
                                onClick={() => {
                                    if (audioElement.current) {
                                        audioElement.current.currentTime += 5
                                    }
                                }}>
                                <img src='./5sForward.svg' alt='' />
                            </button>
                            <button className='shuffle'>shuffle</button>
                        </div>
                    </div>
                    <div className='progress-bar-wrapper' onClick={(e) => handleSeekTo(e)}>
                        <div
                            className='progres'
                            style={{
                                width: `calc(${(progres / (audioElement.current?.duration || 1)) * 100}%)`
                            }}>
                            <div className='point'></div>
                        </div>
                    </div>
                    <div className='ctrls' style={{ display: 'none' }}>
                        <button
                            onClick={() => {
                                if (audioElement.current) timeloop(audioElement.current.currentTime, 5)
                            }}>
                            loop 5s
                        </button>
                        <button onClick={() => setIsLooped(false)}>exit loop</button>
                    </div>
                </div>
            </div>
        )
    }

    return {
        addToQueue,
        removeFromQueue,
        truncateTitle,
        filterTitle,
        fetchSearchResults,
        fetchExtendedSearchResults,
        fetchCharts,
        fetchStream,
        playNextSong,
        playAsNextSong,
        playLastSong,
        setSrc,
        setCurrentlyPlaying,
        setQueue,
        setNextSongData,
        setLoading,
        rankVideoStreams,
        rankThumbnails,
        //getNextSongId,
        linkToSong,
        chartPath,
        searchPath,
        Player,
        currentlyPlaying,
        isLoading,
        queue,
        src,
        nextSongData,
        userConfig,
        API_URL,
        API_2_URL
    }
}

export function PlaylistEngine() {
    function createPlaylist(name: string) {}

    function deletePlaylist(name: string) {}

    function addToPlaylist(playlistName: string, item: Stream) {}

    function removeFromPlaylist(playlistName: string, item: Stream) {}

    function exportPlaylist(name: string) {}

    function importPlaylist(s: string) {}

    function getAllPlaylists() {
        let storage = { ...localStorage }
        let playlists: Playlist[] = []
        for (let i = 0; i < Object.keys(storage).length; i++) {
            let key = Object.keys(storage)[i]
            let val = storage[key]

            if (key.startsWith('playlist')) playlists.push(val)
        }
        return playlists
    }

    return {
        createPlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
        importPlaylist,
        exportPlaylist,
        getAllPlaylists
    }
}

export type Playlist = {
    createdAt: number
    lastEdited: number
    items: Stream[]
    name: string
    thumbnailUrl: string
    playlistType: string
    creatorName: string
}
