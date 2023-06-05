import { Routes, Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import Player from './Components/Player'
import AccountPage from './Routes/account'
import { ChartsPage } from './Routes/charts'
import PlaylistsPage from './Routes/playlists'
import { SearchPage } from './Routes/search'
import SoundCore from './Components/SoundCore'
import { Nav, TopBar } from './App'

export default function App() {
    const soundCore = SoundCore()
    return (
        <BrowserRouter>
            <TopBar />
            <button onClick={soundCore.playnextSong}>click me</button>
            <Routes>
                <Route
                    path='/search'
                    element={
                        <SearchPage queue={soundCore.queue} setQueue={soundCore.setQueue} />
                    }></Route>
                <Route
                    path='/charts'
                    element={
                        <ChartsPage
                            queue={soundCore.queue}
                            setQueue={soundCore.setQueue}
                            region={'US'}
                        />
                    }
                />
                <Route
                    path='/playlists'
                    element={
                        <PlaylistsPage queue={soundCore.queue} setQueue={soundCore.setQueue} />
                    }
                />
                <Route path='/account' element={<AccountPage />} />
            </Routes>
            <Player
                currentlyPlaying={soundCore.currentlyPlaying}
                next={soundCore.playnextSong}
                src={soundCore.src}
            />
            <Nav />
        </BrowserRouter>
    )
}
