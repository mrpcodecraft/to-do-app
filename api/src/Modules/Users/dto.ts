import {IsEmail, IsString, IsPhoneNumber, IsDefined, IsStrongPassword} from "class-validator";

export default class AdminUserDTO {

    @IsDefined({
        message: "Name should be defined",
        always: true
    })
    @IsString({
        message: "Name should be a string",
        always: true
    })
    public name!: string;
    
    @IsDefined({
        message: "Email should be defined",
        always: true
 
    })
    @IsString({
        message: "Email should be a string",
        always: true
    })
    @IsEmail({
        host_whitelist: [
            "gmail.com", 
            "yahoo.com", 
            "xyz.com"
        ],
    },{
        message: "Email should be a valid email address",
        always: true
    })
    public email!: string;

    @IsDefined({
        message: "Phone number should be defined",
        always: true
    })
    @IsString({
        message: "Phone number should be a string",
        always: true
    })
    @IsPhoneNumber("IN")
    public phone_number!: string;

    @IsDefined({
        message: "Password should be defined",
        always: true
    })
    @IsString({
        message: "Password should be a string",
        always: true
    })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, {
        message: "Password should be a strong password with atleast one smallcase, one uppercase, one symbol and one number.",
        always: true
    })
    public password!: string;
}