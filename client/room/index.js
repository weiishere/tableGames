import React, { Component } from 'react';
import { render } from 'react-dom';
import ReactDom from 'react-dom';
import Majiang from '../games/majiang';
import '../reset.less';
import './style.less';

class Room extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        const majiang = new Majiang();
        majiang.init();
    }
    componentWillUnmount() {
        //majiang.removeAll();
    }
    render() {
        return (
            <div id="canvas">loading...</div>
        );
    }
}

render(
    <Room />,
    document.getElementById('layout')
)