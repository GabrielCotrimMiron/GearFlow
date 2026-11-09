package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.ItemOS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemOSRepository extends JpaRepository<ItemOS, Integer> {
}