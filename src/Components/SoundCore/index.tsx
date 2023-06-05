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
    VideoStream
} from '../../api/Client'

export default function SoundCore() {
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

    const searchPath = (query: string, filter: SearchTypes) =>
        `/search?filter=music_${filter}&q=${query}`
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
        currentlyPlaying: Stream | undefined
        src: string
    }

    function Player(props: PlayerProps) {
        const audioElement = useRef<HTMLAudioElement | null>(null)
        const [playing, setPlaying] = useState(false)
        const [progres, setProgres] = useState(0)

        const [isLooped, setIsLooped] = useState(false)
        const loopRef = useRef<{ position: number; duration: number } | null>(null) // Store loop position and duration

        const [isSwipedUp, setIsSwipedUp] = useState(true)
        const [startY, setStartY] = useState(0)
        const [offsetY, setOffsetY] = useState(0)
        const playerRef = useRef<HTMLDivElement>(null)

        const [currentChapter, setCurrentChapter] = useState<Chapter>()

        const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
            const touch = event.touches[0]
            setStartY(touch.pageY)
        }

        const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
            const touch = event.touches[0]
            const currentY = touch.pageY
            const delta = currentY - startY

            setOffsetY(delta)
        }

        const handleTouchEnd = () => {
            if (offsetY < -50) {
                setIsSwipedUp(true)
            } else {
                setIsSwipedUp(false)
            }
            setOffsetY(0)
        }

        function timeloop(position: number, duration: number) {
            console.log(
                `requesting loop from ${position}s for ${duration * 1000}ms. audioTrack is at ${
                    audioElement.current?.currentTime
                }`
            )
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

            console.log('isLooping updated: ', isLooped)

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
            if (currentTime >= audioElement.duration - 1) {
                alert('song has ended!')
                props.next()
            }
        }

        const handleSeekTo = (event: React.MouseEvent) => {
            const x = event.clientX
            let toSecond =
                (x / event.currentTarget.clientWidth) * (audioElement.current?.duration || 1)
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
                    audioElement.current &&
                    audioElement.current.src &&
                    audioElement.current.src !== ''
                        ? 'track-loaded'
                        : 'no-track-loaded'
                }`}
                //style={{ bottom: isSwipedUp ? 'calc(90vh - 1px)' : 0 }}
                ref={playerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}>
                {true ? (
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
                ) : (
                    <video controls onTimeUpdate={handleProgress} hidden>
                        <source src={props.src} type='video/mp4'></source>
                    </video>
                )}
                <div className='progress-bar-wrapper' onClick={(e) => handleSeekTo(e)}>
                    <div
                        className='progres'
                        style={{
                            width: `calc(${
                                (progres / (audioElement.current?.duration || 1)) * 100
                            }%)`
                        }}>
                        <div className='point'></div>
                    </div>
                </div>
                <div className='ctrls'>
                    <button onClick={() => setIsSwipedUp(!isSwipedUp)}>
                        {isSwipedUp ? '↓' : '↑'}
                    </button>
                    <button>&lt;</button>
                    <button
                        onClick={() => {
                            if (audioElement.current) {
                                audioElement.current.currentTime -= 5
                            }
                        }}>
                        <img src='./5sBackward.svg' alt='' />
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            playing ? audioElement.current?.pause() : audioElement.current?.play()
                            setPlaying(!playing)
                        }}>
                        {playing ? 'pause' : 'play'}
                    </button>
                    <button
                        onClick={() => {
                            if (audioElement.current) {
                                audioElement.current.currentTime += 5
                            }
                        }}>
                        <img src='./5sForward.svg' alt='' />
                    </button>
                    <button onClick={props.next}>&gt;</button>
                    <button>…</button>
                </div>
                <div className='expand' onMouseOver={() => setIsSwipedUp(true)}>
                    <div className='img-container'>
                        <img
                            loading='lazy'
                            src={props.currentlyPlaying?.thumbnailUrl}
                            alt='cover'
                        />
                    </div>
                    <div className='infos'>
                        <p className='title'>title: {props.currentlyPlaying?.title}</p>
                        <p>
                            played: {progres} of {audioElement.current?.duration} seconds
                        </p>
                        <p className='chapter'>chapter: {currentChapter?.title}</p>
                    </div>
                    <div className='ctrls'>
                        <button
                            onClick={() => {
                                if (audioElement.current)
                                    timeloop(audioElement.current.currentTime, 5)
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
        playnextSong,
        API_URL,
        API_2_URL,
        rankThumbnails,
        getNextSongId,
        linkToSong,
        chartPath,
        searchPath,
        currentlyPlaying,
        setCurrentlyPlaying,
        queue,
        setQueue,
        src,
        setSrc,
        nextSongData,
        setNextSongData,
        Player,
        userConfig
    }
}
