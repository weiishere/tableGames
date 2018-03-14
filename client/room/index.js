import React, { Component } from 'react';
import { render } from 'react-dom';
import './style.less';

class Room extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div className='wrapper'>
            <div className='dockBottom'></div>
            <div className='dockLeft'></div>
            <div className='dockRight'></div>
            <div className='dockTop'></div>
        </div>
    }
}
render(
    <Room  />,
    document.getElementById('layout')
)