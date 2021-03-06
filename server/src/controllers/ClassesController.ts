import {Request, Response} from "express";
import db from "../database/connection";
import convertHoursToMinutes from "../utils/convertHoursToMinutes";

interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesController {
    async index(request: Request, response: Response) {
        const filters = request.query;
        if(!filters.week_day || !filters.subject || !filters.time){
            response.status(400).json({
                error: "Missing filters to search classes"
            });
        }

        const subject=filters.subject as string;
        const week_day=filters.week_day as string;
        const time=filters.time as string;

        const timeInMinutes = convertHoursToMinutes(time);

        //o whereExists faz o seguinte:
        //ve se existe na table class_schedule onde o id especificado atende no dia especificado e no horario especificado
        const classes = await db("classes").whereExists(function(){
            this.select("class_schedule.*").from("class_schedule")
            .whereRaw("`class_schedule`.`class_id` = `classes`.`id`")
            .whereRaw("`class_schedule`.`week_day` = ??", [Number(week_day)])
            .whereRaw("`class_schedule`.`from` <= ??", [timeInMinutes])
            .whereRaw("`class_schedule`.`to` > ??", [timeInMinutes]);
        })
        .where("classes.subject", "=", subject)
        .join("users", "classes.user_id", "=", "users.id")
        .select(["classes.*", "users.*"]);

        response.json(classes);
    }

    async create(request: Request, response: Response): Promise<void> {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;

        const transaction = await db.transaction();
        try {

            const insertedUsersIds = await transaction("users").insert({
                name,
                avatar,
                whatsapp,
                bio
            });
            const user_id = insertedUsersIds[0];

            const insertedClassesIds = await transaction("classes").insert({
                subject,
                cost,
                user_id
            })

            const class_id = insertedClassesIds[0];

            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHoursToMinutes(scheduleItem.from),
                    to: convertHoursToMinutes(scheduleItem.to)
                };
            });

            await transaction("class_schedule").insert(classSchedule);

            await transaction.commit();

            response.status(201).send();
        } catch(err) {
            await transaction.rollback();
            response.status(400).json({
                error: "Unexpected error while creating new class"
            })
        }
    }
}