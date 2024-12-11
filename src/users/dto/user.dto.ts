import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  Matches,
} from '@nestjs/class-validator';

export class UserDto {
  @IsString({ message: 'Поле имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  name: string;

  @IsString({ message: 'Поле логин должно быть строкой' })
  @IsNotEmpty({ message: 'Логин не может быть пустым' })
  login: string;

  @IsString({ message: 'Поле пароля должно быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Пароль должен содержать хотя бы одну заглавную букву и одну цифру',
  })
  password: string;

  @IsArray({ message: 'ID роли должен быть массивом' })
  @ArrayNotEmpty({ message: 'Массив с ролями не может быть пустым' })
  @IsNumber({}, { each: true, message: 'Каждый ID роли должен быть числом' })
  roles: number[];
}
