import './App.css'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { SearchPage } from './Routes/search'
import PlaylistsPage from './Routes/playlists'
import AccountPage from './Routes/account'
import { ChartsPage } from './Routes/charts'
import SoundCore from './Components/SoundCore'
import { SongId } from './api/Client'

export const API_URL = 'https://watchapi.whatever.social'
export const API_2_URL = 'https://hyperpipeapi.onrender.com'

export type FetchError = {
    error: string
    details: Promise<string>
}

export const userConfig = {
    dataSaver: false,
    autoStart: true,
    playOn: true,
    resumeTracksIf: {
        minTrackDuration: 60 * 10
    }
}

export default function App() {
    const soundCore = SoundCore()

    return (
        <BrowserRouter>
            <TopBar soundCore={soundCore} />
            {/*<button onClick={soundCore.playnextSong}>click me</button>*/}
            <Routes>
                <Route
                    path='/search'
                    element={
                        <SearchPage
                            queue={soundCore.queue}
                            setQueue={soundCore.setQueue}
                            fetchExtendedSearchResults={soundCore.fetchExtendedSearchResults}
                            fetchSearchResults={soundCore.fetchSearchResults}
                            filterTitle={soundCore.filterTitle}
                            truncateTitle={soundCore.truncateTitle}
                        />
                    }></Route>
                <Route
                    path='/charts'
                    element={
                        <ChartsPage
                            fetchCharts={soundCore.fetchCharts}
                            rankThumbnails={soundCore.rankThumbnails}
                            queue={soundCore.queue}
                            setQueue={soundCore.setQueue}
                            region={'US'}
                        />
                    }
                />
                <Route path='/playlists' element={<PlaylistsPage queue={soundCore.queue} setQueue={soundCore.setQueue} />} />
                <Route path='/account' element={<AccountPage />} />
            </Routes>
            <soundCore.Player currentlyPlaying={soundCore.currentlyPlaying} next={() => {}} src={soundCore.src} />
            <Nav />
        </BrowserRouter>
    )
}

interface TopBarProps {
    soundCore: ReturnType<typeof SoundCore>
}

export function TopBar(props: TopBarProps) {
    return <div className='top-bar'>{props.soundCore.isLoading ? 'loading player...' : ''}</div>
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
                <p className='title'>{SoundCore().truncateTitle(SoundCore().filterTitle(props.title))}</p>
                <p className='subtitle' onClick={() => console.log('goto artist[' + props.artistId + ']')}>
                    {props.artist}
                </p>
            </div>
            <button type='button' className='like-button'>
                <img loading='lazy' src='./heart.svg' alt='fav' className={props.liked ? 'filled' : ''} />
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
