import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  Matches,
  IsOptional,
  ValidateIf,
  IsNumber,
} from '@nestjs/class-validator';

export class UpdateUserDto {
  @IsOptional()
  @ValidateIf((object: UpdateUserDto) =>
    Object.values(object).some((value) => value !== undefined),
  )
  @IsString({ message: 'Поле имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  name: string;

  @IsOptional()
  @ValidateIf((object: UpdateUserDto) =>
    Object.values(object).some((value) => value !== undefined),
  )
  @IsString({ message: 'Поле логин должно быть строкой' })
  @IsNotEmpty({ message: 'Логин не может быть пустым' })
  login: string;

  @IsOptional()
  @ValidateIf((object: UpdateUserDto) =>
    Object.values(object).some((value) => value !== undefined),
  )
  @IsString({ message: 'Поле пароля должно быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Пароль должен содержать хотя бы одну заглавную букву и одну цифру',
  })
  password: string;

  @IsOptional()
  @ValidateIf((object: UpdateUserDto) =>
    Object.values(object).some((value) => value !== undefined),
  )
  @IsArray({ message: 'ID роли должен быть массивом' })
  @ArrayNotEmpty({ message: 'Массив с ролями не может быть пустым' })
  @IsNumber({}, { each: true, message: 'Каждый ID роли должен быть числом' })
  roles: number[];
}
