import React, {useEffect, useState} from "react";
import {Loading, useGame, useAuth, useTimer, HowlWrapper} from "common/Essentials";
import {AdminAuth} from "common/Auth";
import {Content, GameView, TextContent, BlockContent, ExitButton, QRCodeContent} from "common/View";
import {useHistory} from "react-router-dom";
import FinalQuestions from "weakest/FinalQuestions";
import {generateClientUrl} from "../common/View";

const Music = {
    intro: HowlWrapper('/sounds/weakest/intro.mp3'),
    background: HowlWrapper('/sounds/weakest/background.mp3'),
    questions: HowlWrapper('/sounds/weakest/questions.mp3'),
}

const Sounds = {
    gong: HowlWrapper('/sounds/weakest/gong.mp3'),
    question_start: HowlWrapper('/sounds/weakest/question_start.mp3'),
    question_end: HowlWrapper('/sounds/weakest/question_end.mp3'),
    weakest_reveal: HowlWrapper('/sounds/weakest/weakest_reveal.mp3'),
}

const loadSounds = () => {
    Object.values(Music).forEach(m => m.load());
    Object.values(Sounds).forEach(m => m.load());
}

const stopMusic = () => {
    Object.values(Music).forEach(m => m.stop());
};

const changeMusic = (old, next) => {
    if (old !== next) {
        stopMusic();
        if (Music[next]) Music[next].play();
        return next;
    }
}

const Timer = () => {
    const time = useTimer(WEAKEST_API);
    const date = new Date(0);
    date.setSeconds(time);
    const timeStr = date.toISOString().substr(14, 5);
    return <TextContent>{timeStr}</TextContent>
}

const MFinalQuestions = ({game}) => {
    return <BlockContent>
        <FinalQuestions game={game} />
    </BlockContent>;
}

const useStateContent = (game) => {
    switch (game.state) {
        case "waiting_for_players":
            return <QRCodeContent value={generateClientUrl('/weakest/client?token=' + game.token)}>
                {game.token}
            </QRCodeContent>;
        case "round":
            return <TextContent>Round {game.round}</TextContent>;
        case "questions":
            return <Timer/>;
        case "weakest_choose":
            return <TextContent>Choose the Weakest</TextContent>;
        case "weakest_reveal":
            return <TextContent>{game.players.find(p => p.id === game.weakest).name}</TextContent>;
        case "final":
            return <TextContent>Final</TextContent>;
        case "final_questions":
            return <MFinalQuestions game={game}/>;
        case "end":
            return <TextContent>Game over</TextContent>;
        default:
            return <TextContent>The Weakest</TextContent>
    }
};

const WeakestView = () => {
    const [music, setMusic] = useState();
    const game = useGame(WEAKEST_API, (game) => {
        if (["intro"].includes(game.state)) {
            setMusic(changeMusic(music, "intro"));
        } else if (["questions", "final_questions"].includes(game.state)) {
            setMusic(changeMusic(music, "questions"));
        } else {
            setMusic(changeMusic(music, "background"));
        }

        if (["questions", "final_questions"].includes(game.state)) {
            Sounds.question_start.play();
        } else if (["weakest_reveal"].includes(game.state)) {
            Sounds.weakest_reveal.play();
        } else if (["weakest_choose", "end"].includes(game.state)) {
            Sounds.question_end.play();
        }
    }, (message) => {
        switch (message) {
            case "gong":
                Sounds.gong.play();
                break;
            case "sound_stop":
                setMusic(changeMusic(music, ""));
                break;
        }
    });

    useEffect(() => {
        loadSounds();
        return () => {
            stopMusic();
        }
    }, []);

    const [connected, setConnected] = useAuth(WEAKEST_API);

    const history = useHistory();
    const onLogout = () => {
        WEAKEST_API.logout();
        history.push("/admin");
    };

    if (!connected) return <AdminAuth api={WEAKEST_API} setConnected={setConnected}/>;
    if (!game) return <Loading/>;

    return <GameView>
        <ExitButton onClick={onLogout}/>
        <Content>{useStateContent(game)}</Content>
    </GameView>
}

export default WeakestView;
