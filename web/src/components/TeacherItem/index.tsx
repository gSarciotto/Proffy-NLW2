import React from "react";

import whatsAppIcon from "../../assets/images/icons/whatsapp.svg";

import "./styles.css";
import api from "../../services/api";

export interface Teacher {
    avatar: string;
    bio: string;
    cost: number;
    id: number;
    name: string;
    subject: string;
    whatsapp: string;
}

interface TeacherItemProps {
    teacher: Teacher;
}

const TeacherItem: React.FC<TeacherItemProps> = (props) => {
    const teacher=props.teacher;

    function createConnection() {
        api.post("connections", {
            user_id: teacher.id
        });
    }

    return (
    <article className="teacher-item">
        <header>
            <img src={teacher.avatar} alt={teacher.name} />
            <div>
                <strong>{teacher.name}</strong>
                <span>{teacher.subject}</span>
            </div>
        </header>

        <p>
            {teacher.bio}
        </p>

        <footer>
            <p>
                Preço/Hora
                <strong>R$ {teacher.cost}</strong>
            </p>
            <a target="_blank" rel="noopener noreferrer" onClick={createConnection} href={`https://wa.me/${teacher.whatsapp}`}>
                <img src={whatsAppIcon} alt="Whatsapp" />
                Entrar em contato
            </a>
        </footer>
    </article>
    );
}

export default TeacherItem;