package com.gearflow.gearflow_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//essas anotações com @ servem para abstrair funcionalidades/classes Eles servem para adicionar informações extras às classes, métodos e atributos, permitindo que frameworks como o Spring façam coisas automaticamente
@SpringBootApplication
public class GearflowSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(GearflowSystemApplication.class, args);
	}

}
