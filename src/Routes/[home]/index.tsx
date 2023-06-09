import { useEffect, useState } from 'react'
import { PageProps, UserSettings } from '../../App'
import { ChartResults, Regions } from '../../api/Client'
import { Link } from 'react-router-dom'

interface HomeProps extends PageProps {
    userSettings: UserSettings
}

export default function Home(props: HomeProps) {
    const [charts, setCharts] = useState<{ region: Regions; charts: ChartResults }>()

    useEffect(() => {
        async function f() {
            setCharts(await props.soundCore.getCharts(props.userSettings.region))
        }
        f()
    }, [])

    return (
        <div>
            <h2>Trending right now</h2>
            <div className='chart-artists'>
                {charts?.charts.artists.map((e) => (
                    <Link to={'/channel?id=' + e.id} key={e.id}>
                        {e.title}
                    </Link>
                ))}
            </div>
            <div className='chart-songs'>
                {charts?.charts.trending.map((e) => (
                    <Link to={'/track?id=' + e.id} key={e.id}>
                        <div>{e.title}</div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
