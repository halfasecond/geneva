import * as Styled from './ProbablyWood.style'

const ProbablyWood: React.FC<{ left: number, top: number }> = ({ left, top }) => {
    return (
        <Styled.Div style={{ left, top }}>
            <div>
                <h2>Probably Wood</h2>
                <Styled.Forest />
                <Styled.Forest />
                <Styled.Bear />
                <p>{'Sometimes, if you look closely, you can catch a glimpse of Kitty International\'s Two Bit Bear'}</p>
            </div>
        </Styled.Div>
    )
}

export default ProbablyWood

// entities.forest = {
//     left: 3500, top: 1000, width: 500, height: 500, zIndex: 2, position: 'absolute', opacity: 0.8,
//     backgroundImage: `url(${forest})`, backgroundSize: 'contain',
//     renderer: <Forest />
//   }
//   entities.forest2 = {
//     left: 410, top: 50, width: 400, height: 400, zIndex: 2, position: 'absolute', opacity: 0.8,
//     backgroundImage: `url(${forest})`, backgroundSize: 'contain',
//     renderer: <Forest />
//   }

//   entities.forestTitle = {
//     left: 410, top: -20, width: 400, height: 400, zIndex: 2, position: 'absolute', opacity: 0.6,
//     renderer: ({ left, top, width, height, zIndex, position, opacity }) => 
//       <h2 style={{ left, top, width, height, zIndex, position, opacity }}>{'Probably Wood'}</h2>
//   }

//   entities.FarokhAokitheHappyBrownBear = {
//     left: 280, top: 100, width: 400, height: 400, zIndex: 1, position: 'absolute',
//     backgroundImage: `url(${farouk})`, backgroundSize: 'contain',
//     renderer: ({ left, top, width, height, zIndex, position, backgroundImage, backgroundSize }) =>
//       <div style={{ left, top, width, height, zIndex, position, backgroundImage, backgroundSize }}>
//         <div style={{ marginTop: 360, marginLeft: 200, position, width: 400 }}>
//           {'If you look closely sometimes you can get a glimpse of Kitty International\'s Two Bit Bear'}
//         </div>
//       </div>
//   }